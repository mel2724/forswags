import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  evaluationId: string;
  sport: string;
  position: string;
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
    const { evaluationId, sport, position }: NotificationRequest = await req.json();

    if (!evaluationId) {
      throw new Error("evaluationId is required");
    }

    console.log(`Notifying coaches about new evaluation: ${evaluationId}`);

    // Get all active coaches with matching specializations
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from("coach_profiles")
      .select(`
        user_id,
        full_name,
        specializations
      `)
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

    // Filter coaches by specialization if provided
    const matchingCoaches = coaches.filter((coach) => {
      if (!sport || !coach.specializations) return true;
      
      const specs = Array.isArray(coach.specializations) 
        ? coach.specializations 
        : [];
      
      return specs.some((spec: string) => 
        spec.toLowerCase().includes(sport.toLowerCase())
      );
    });

    console.log(`Found ${matchingCoaches.length} matching coaches`);

    // Create in-app notifications for all matching coaches
    const notifications = matchingCoaches.map((coach) => ({
      user_id: coach.user_id,
      type: "new_evaluation",
      title: "New Evaluation Available",
      message: `A new ${sport} ${position} evaluation is ready for review.`,
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

    // Optionally send email notifications to coaches
    // This can be enabled based on coach preferences
    const availableUrl = `${Deno.env.get("SUPABASE_URL")?.replace(/\/.*/, "")}/coach/available`;
    
    for (const coach of matchingCoaches) {
      // Get coach email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", coach.user_id)
        .single();

      if (profile?.email) {
        const emailPayload = {
          to: profile.email,
          template: "eval_started", // Reuse existing template
          variables: {
            coach_name: coach.full_name || "Coach",
            sport: sport,
            position: position,
            evaluations_url: availableUrl,
          },
        };

        supabaseAdmin.functions.invoke("send-notification-email", {
          body: emailPayload,
        }).catch((error) => {
          console.error(`Failed to send email to ${profile.email}:`, error);
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${matchingCoaches.length} coaches`,
        count: matchingCoaches.length 
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