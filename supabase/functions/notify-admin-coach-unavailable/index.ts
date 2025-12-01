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
    console.log("[NOTIFY-ADMIN-COACH-UNAVAILABLE] Function started");

    const { evaluation_id, athlete_id, requested_coach_id } = await req.json();

    if (!evaluation_id || !athlete_id) {
      throw new Error("Missing required fields");
    }

    // Get athlete info
    const { data: athlete } = await supabaseClient
      .from("athletes")
      .select("user_id")
      .eq("id", athlete_id)
      .single();

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", athlete?.user_id)
      .single();

    // Get all admins
    const { data: adminRoles } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("[NOTIFY-ADMIN-COACH-UNAVAILABLE] No admins found");
      return new Response(
        JSON.stringify({ success: false, message: "No admins found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const athleteName = profile?.full_name || "An athlete";
    const coachInfo = requested_coach_id ? "Previous coach is unavailable." : "No coach assigned.";

    // Create notifications for all admins
    const notifications = adminRoles.map((admin) => ({
      user_id: admin.user_id,
      type: "admin_action",
      title: "Evaluation Needs Coach Assignment",
      message: `${athleteName} requested a re-evaluation. ${coachInfo} Please assign a coach.`,
      link: `/admin/evaluations/${evaluation_id}`,
    }));

    const { error: notifError } = await supabaseClient
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("[NOTIFY-ADMIN-COACH-UNAVAILABLE] Error creating notifications:", notifError);
      throw notifError;
    }

    console.log("[NOTIFY-ADMIN-COACH-UNAVAILABLE] Notifications sent to admins");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[NOTIFY-ADMIN-COACH-UNAVAILABLE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
