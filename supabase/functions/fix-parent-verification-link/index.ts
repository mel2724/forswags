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
    // Authenticate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verification_id, athlete_id } = await req.json();

    if (!verification_id || !athlete_id) {
      return new Response(
        JSON.stringify({ error: "Missing verification_id or athlete_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get verification record
    const { data: verification, error: verifyError } = await supabaseClient
      .from("parent_verifications")
      .select("*, athletes(id, user_id)")
      .eq("id", verification_id)
      .single();

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ error: "Verification record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get athlete record
    const { data: athlete, error: athleteError } = await supabaseClient
      .from("athletes")
      .select("id, user_id, date_of_birth")
      .eq("id", athlete_id)
      .single();

    if (athleteError || !athlete) {
      return new Response(
        JSON.stringify({ error: "Athlete record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user_id matches
    if (verification.user_id !== athlete.user_id) {
      return new Response(
        JSON.stringify({ error: "User ID mismatch between verification and athlete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update verification record with athlete_id
    const { error: updateVerifyError } = await supabaseClient
      .from("parent_verifications")
      .update({ athlete_id: athlete_id })
      .eq("id", verification_id);

    if (updateVerifyError) {
      console.error("Error updating verification:", updateVerifyError);
      throw updateVerifyError;
    }

    // Update athlete record with parent verification data
    const { error: updateAthleteError } = await supabaseClient
      .from("athletes")
      .update({
        parent_email: verification.parent_email,
        is_parent_verified: true,
        parent_verified_at: new Date().toISOString(),
        consent_expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        visibility: 'public',
        public_profile_consent: true,
      })
      .eq("id", athlete_id);

    if (updateAthleteError) {
      console.error("Error updating athlete:", updateAthleteError);
      throw updateAthleteError;
    }

    // Log security event
    await supabaseClient.rpc("log_security_event", {
      p_event_type: "admin_parent_verification_fix",
      p_severity: "high",
      p_description: "Admin manually linked parent verification to athlete",
      p_metadata: {
        admin_id: user.id,
        verification_id,
        athlete_id,
        parent_email: verification.parent_email,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Parent verification successfully linked to athlete profile",
        verification_id,
        athlete_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fix-parent-verification-link:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
