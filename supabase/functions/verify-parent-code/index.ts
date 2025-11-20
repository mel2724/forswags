import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { parent_email, verification_code } = await req.json();
    
    // Extract client IP address for audit trail
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!parent_email || !verification_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check verification code (no authentication required for parent verification)
    const { data: verification, error: verifyError } = await supabaseClient
      .from("parent_verifications")
      .select("*, athletes(id, user_id)")
      .eq("parent_email", parent_email)
      .eq("verification_code", verification_code)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (verifyError || !verification) {
      console.error("Verification lookup error:", verifyError);
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired verification code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle case where athlete_id is NULL but user_id exists
    // This can happen if verification was sent during onboarding before athlete profile was created
    let athleteId = verification.athlete_id;
    let athleteUserId = verification.athletes?.user_id;

    if (!athleteId && verification.user_id) {
      console.log("Athlete ID is NULL, attempting to lookup by user_id:", verification.user_id);
      
      const { data: athleteRecord, error: athleteLookupError } = await supabaseClient
        .from("athletes")
        .select("id, user_id")
        .eq("user_id", verification.user_id)
        .single();

      if (athleteRecord && !athleteLookupError) {
        console.log("Found athlete record:", athleteRecord.id);
        athleteId = athleteRecord.id;
        athleteUserId = athleteRecord.user_id;

        // Update the verification record with the found athlete_id
        const { error: updateVerifyError } = await supabaseClient
          .from("parent_verifications")
          .update({ athlete_id: athleteId })
          .eq("id", verification.id);

        if (updateVerifyError) {
          console.error("Error updating verification with athlete_id:", updateVerifyError);
        } else {
          console.log("Successfully linked verification to athlete");
        }
      } else {
        console.error("Could not find athlete record for user_id:", verification.user_id, athleteLookupError);
      }
    }

    if (!athleteId) {
      console.error("No athlete_id found for verification:", verification.id);
      return new Response(
        JSON.stringify({ valid: false, error: "Athlete profile not found. Please complete your profile first." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabaseClient
      .from("parent_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      throw updateError;
    }

    // Update athlete profile with parent verification data
    const { error: athleteError } = await supabaseClient
      .from("athletes")
      .update({ 
        parent_email: parent_email,
        visibility: 'public',
        is_parent_verified: true,
        parent_verified_at: new Date().toISOString(),
        consent_expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        public_profile_consent: true,
      })
      .eq("id", athleteId);

    if (athleteError) {
      console.error("Error updating athlete visibility:", athleteError);
      throw athleteError;
    }

    // Log security event with IP address for COPPA compliance
    await supabaseClient.rpc("log_security_event", {
      p_event_type: "parent_email_verified",
      p_severity: "medium",
      p_description: "Parent email verified for minor athlete",
      p_metadata: {
        athlete_id: verification.athlete_id,
        parent_email,
        verification_id: verification.id,
        ip_address: clientIp,
      },
    });

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-parent-code:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});