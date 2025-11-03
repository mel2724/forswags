import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-PRIME-DIME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get athlete profile
    const { data: athlete, error: athleteError } = await supabaseClient
      .from("athletes")
      .select("id, sport, position, graduation_year, gpa, sat_score, act_score")
      .eq("user_id", user.id)
      .single();

    if (athleteError || !athlete) {
      throw new Error("Athlete profile not found");
    }

    logStep("Athlete found", { athleteId: athlete.id });

    // Check if analysis was already requested recently (within 7 days)
    const { data: existingRequest } = await supabaseClient
      .from("athletes")
      .select("analysis_requested_at")
      .eq("id", athlete.id)
      .single();

    if (existingRequest?.analysis_requested_at) {
      const daysSinceRequest = Math.floor(
        (Date.now() - new Date(existingRequest.analysis_requested_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceRequest < 7) {
        return new Response(
          JSON.stringify({ 
            error: `You requested analysis ${daysSinceRequest} day(s) ago. Please wait at least 7 days between analysis requests.` 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Mark analysis as requested
    const { error: updateError } = await supabaseClient
      .from("athletes")
      .update({ 
        analysis_requested_at: new Date().toISOString(),
        analysis_notified_at: null // Reset notification
      })
      .eq("id", athlete.id);

    if (updateError) throw updateError;

    logStep("Analysis request recorded");

    // Trigger the actual analysis
    const { data: analysisData, error: analysisError } = await supabaseClient.functions.invoke(
      "analyze-college-match",
      {
        body: { athleteId: athlete.id }
      }
    );

    if (analysisError) {
      logStep("Analysis error", { error: analysisError });
      
      // Send error notification to tech support
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          body: JSON.stringify({
            from: 'ForSWAGs Errors <noreply@updates.forswags.com>',
            to: ['tech@forswags.com'],
            subject: '"Prime Dime" Analysis Trigger Error - ForSWAGs',
              html: `
                <h2>"Prime Dime" Analysis Trigger Error</h2>
                <p><strong>Athlete ID:</strong> ${athlete.id}</p>
                <p><strong>Error:</strong> ${JSON.stringify(analysisError)}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              `,
            }),
          });
        }
      } catch (notifyError) {
        logStep("Failed to send error notification", { error: notifyError });
      }
      // Don't fail the request, analysis can be retried
    } else {
      logStep("Analysis triggered successfully", { result: analysisData });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Analysis requested. You'll be notified when your matches are ready!"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
