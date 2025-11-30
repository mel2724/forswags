import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-PRIME-DIME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athlete_id } = await req.json();
    
    if (!athlete_id) {
      return new Response(
        JSON.stringify({ error: "athlete_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Testing notification for athlete", { athlete_id });

    // Get athlete info
    const { data: athlete, error: athleteError } = await supabaseClient
      .from("athletes")
      .select("id, user_id, analysis_requested_at, analysis_notified_at")
      .eq("id", athlete_id)
      .single();

    if (athleteError || !athlete) {
      logStep("Athlete not found", { error: athleteError?.message });
      return new Response(
        JSON.stringify({ error: "Athlete not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Athlete found", { athlete });

    // Get profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", athlete.user_id)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found", { error: profileError?.message });
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Profile found", { profile });

    // Check for recommendations
    const { data: recommendations, error: recsError } = await supabaseClient
      .from("college_recommendations")
      .select("id, school_id, match_score, recommendation_reasons")
      .eq("athlete_id", athlete_id)
      .limit(10);

    if (recsError) {
      logStep("Error fetching recommendations", { error: recsError.message });
      return new Response(
        JSON.stringify({ error: "Error fetching recommendations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Recommendations found", { count: recommendations?.length || 0 });

    if (!recommendations || recommendations.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No recommendations found for this athlete. Make sure they completed the college questions and recommendations were generated.",
          athlete,
          profile
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manually trigger the notification by calling the notify-prime-dime-ready function
    logStep("Triggering notification function");

    const { data: functionData, error: functionError } = await supabaseClient.functions.invoke(
      "notify-prime-dime-ready",
      { body: {} }
    );

    if (functionError) {
      logStep("Error triggering notification", { error: functionError.message });
      return new Response(
        JSON.stringify({ error: "Error triggering notification", details: functionError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Notification function triggered successfully", { result: functionData });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Prime Dime notification test completed",
        athlete: {
          id: athlete.id,
          name: profile.full_name,
          email: profile.email,
          analysis_requested_at: athlete.analysis_requested_at,
          analysis_notified_at: athlete.analysis_notified_at
        },
        recommendations_count: recommendations.length,
        notification_result: functionData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
