import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  evaluation_id: string;
  is_reevaluation?: boolean;
  coach_id?: string;
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX: Verify authentication (JWT enabled in config.toml)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { evaluation_id, is_reevaluation = false, coach_id }: NotificationRequest = await req.json();

    if (!evaluation_id) {
      throw new Error("evaluation_id is required");
    }

    console.log(`Notifying coaches about ${is_reevaluation ? 're-evaluation' : 'new evaluation'}: ${evaluation_id}`);

    const evaluationType = is_reevaluation ? "re-evaluation" : "evaluation";
    
    // If specific coach is assigned, notify only that coach
    if (coach_id) {
      const { data: coach } = await supabaseAdmin
        .from("coach_profiles")
        .select("user_id, full_name")
        .eq("user_id", coach_id)
        .eq("is_active", true)
        .single();

      if (!coach) {
        throw new Error("Assigned coach not found or inactive");
      }

      const notification = {
        user_id: coach.user_id,
        type: is_reevaluation ? "reevaluation_assigned" : "evaluation_assigned",
        title: is_reevaluation ? "Re-evaluation Assigned" : "Evaluation Assigned",
        message: `A ${evaluationType} has been assigned to you.`,
        link: `/coach/evaluations/${evaluation_id}`,
      };

      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(notification);

      if (notifError) {
        console.error("Failed to create notification:", notifError);
        throw notifError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Notified coach about ${evaluationType}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get all active coaches
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from("coach_profiles")
      .select("user_id, full_name")
      .eq("is_active", true);

    if (coachError) {
      throw new Error(`Failed to fetch coaches: ${coachError.message}`);
    }

    if (!coaches || coaches.length === 0) {
      console.log("No active coaches found");
      return new Response(
        JSON.stringify({ success: true, message: "No coaches to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${coaches.length} active coaches`);

    // Create in-app notifications for all coaches
    const notifications = coaches.map((coach) => ({
      user_id: coach.user_id,
      type: is_reevaluation ? "new_reevaluation" : "new_evaluation",
      title: is_reevaluation ? "New Re-evaluation Available" : "New Evaluation Available",
      message: `A ${evaluationType} is ready for review.`,
      link: `/coach/available`,
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Failed to create notifications:", notifError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${coaches.length} coaches`,
        count: coaches.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-coaches-new-evaluation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});