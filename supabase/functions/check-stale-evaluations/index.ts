import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[CHECK-STALE-EVALUATIONS] Starting check");

    // Check for evaluations not picked up within 48 hours
    const { data: unpickedEvaluations, error: unpickedError } = await supabaseClient
      .from("evaluations")
      .select(`
        id,
        purchased_at,
        athletes!inner(
          user_id,
          profiles!athletes_user_id_fkey(full_name)
        )
      `)
      .eq("status", "pending")
      .is("coach_id", null)
      .lt("purchased_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    if (unpickedError) throw unpickedError;

    console.log(`[CHECK-STALE-EVALUATIONS] Found ${unpickedEvaluations?.length || 0} unpicked evaluations`);

    // Check for evaluations assigned but not completed within 48 hours
    const { data: uncompletedEvaluations, error: uncompletedError } = await supabaseClient
      .from("evaluations")
      .select(`
        id,
        claimed_at,
        coach_id,
        athletes!inner(
          user_id,
          profiles!athletes_user_id_fkey(full_name)
        ),
        coach_profile:coach_profiles!evaluations_coach_id_fkey(full_name)
      `)
      .eq("status", "in_progress")
      .not("claimed_at", "is", null)
      .lt("claimed_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    if (uncompletedError) throw uncompletedError;

    console.log(`[CHECK-STALE-EVALUATIONS] Found ${uncompletedEvaluations?.length || 0} uncompleted evaluations`);

    // Get all admins
    const { data: adminRoles } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("[CHECK-STALE-EVALUATIONS] No admins found");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications = [];

    // Create notifications for unpicked evaluations
    for (const evaluation of unpickedEvaluations || []) {
      const athleteData = evaluation.athletes as any;
      const athleteName = athleteData?.profiles?.full_name || "An athlete";
      const hoursSince = Math.floor((Date.now() - new Date(evaluation.purchased_at).getTime()) / (1000 * 60 * 60));
      
      for (const admin of adminRoles) {
        notifications.push({
          user_id: admin.user_id,
          type: "admin_action",
          title: "Stale Evaluation - Not Picked Up",
          message: `${athleteName}'s evaluation has not been picked up by any coach for ${hoursSince} hours. Please assign a coach.`,
          link: `/admin/evaluations`,
        });
      }
    }

    // Create notifications for uncompleted evaluations
    for (const evaluation of uncompletedEvaluations || []) {
      const athleteData = evaluation.athletes as any;
      const coachData = evaluation.coach_profile as any;
      const athleteName = athleteData?.profiles?.full_name || "An athlete";
      const coachName = coachData?.full_name || "a coach";
      const hoursSince = Math.floor((Date.now() - new Date(evaluation.claimed_at).getTime()) / (1000 * 60 * 60));
      
      for (const admin of adminRoles) {
        notifications.push({
          user_id: admin.user_id,
          type: "admin_action",
          title: "Stale Evaluation - Not Completed",
          message: `${athleteName}'s evaluation assigned to ${coachName} has not been completed for ${hoursSince} hours. Consider reassignment.`,
          link: `/admin/evaluations`,
        });
      }
    }

    if (notifications.length > 0) {
      const { error: notifError } = await supabaseClient
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("[CHECK-STALE-EVALUATIONS] Error creating notifications:", notifError);
        throw notifError;
      }

      console.log(`[CHECK-STALE-EVALUATIONS] Created ${notifications.length} notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        unpicked: unpickedEvaluations?.length || 0,
        uncompleted: uncompletedEvaluations?.length || 0,
        notifications_created: notifications.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[CHECK-STALE-EVALUATIONS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
