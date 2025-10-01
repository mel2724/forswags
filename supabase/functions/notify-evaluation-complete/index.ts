import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  evaluationId: string;
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
    const { evaluationId }: NotificationRequest = await req.json();

    if (!evaluationId) {
      throw new Error("evaluationId is required");
    }

    console.log(`Processing evaluation completion notification for: ${evaluationId}`);

    // Get evaluation details with athlete info
    const { data: evaluation, error: evalError } = await supabaseAdmin
      .from("evaluations")
      .select(`
        *,
        athletes!inner (
          user_id,
          sport,
          position
        )
      `)
      .eq("id", evaluationId)
      .single();

    if (evalError || !evaluation) {
      throw new Error(`Failed to fetch evaluation: ${evalError?.message}`);
    }

    // Get athlete profile
    const { data: athleteProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", evaluation.athletes.user_id)
      .single();

    if (!athleteProfile) {
      throw new Error("Athlete profile not found");
    }

    // Get coach profile
    const { data: coachProfile } = await supabaseAdmin
      .from("coach_profiles")
      .select("full_name")
      .eq("user_id", evaluation.coach_id)
      .single();

    const coachName = coachProfile?.full_name || "Your coach";

    // Create in-app notification
    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: evaluation.athletes.user_id,
        type: "evaluation_complete",
        title: "Evaluation Complete!",
        message: `${coachName} has completed your evaluation. View your feedback and scores now.`,
        link: `/evaluations`,
      });

    if (notifError) {
      console.error("Failed to create in-app notification:", notifError);
    }

    // Send email notification
    const evaluationUrl = `${Deno.env.get("SUPABASE_URL")?.replace(/\/.*/, "")}/evaluations`;
    
    const emailPayload = {
      to: athleteProfile.email,
      template: "eval_complete",
      variables: {
        athlete_name: athleteProfile.full_name || "Athlete",
        coach_name: coachName,
        evaluation_url: evaluationUrl,
      },
    };

    const emailResponse = await supabaseAdmin.functions.invoke("send-notification-email", {
      body: emailPayload,
    });

    if (emailResponse.error) {
      console.error("Failed to send email:", emailResponse.error);
    } else {
      console.log("Email notification sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifications sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-evaluation-complete:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});