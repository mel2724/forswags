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
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired verification code" }),
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

    // Update athlete profile to public if they have an athlete record
    if (verification.athletes) {
      const { error: athleteError } = await supabaseClient
        .from("athletes")
        .update({ 
          visibility: 'public',
          is_parent_verified: true,
          parent_verified_at: new Date().toISOString(),
          consent_expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        })
        .eq("id", verification.athletes.id);

      if (athleteError) {
        console.error("Error updating athlete visibility:", athleteError);
      }
    }

    // Log security event
    await supabaseClient.rpc("log_security_event", {
      p_event_type: "parent_email_verified",
      p_severity: "medium",
      p_description: "Parent email verified for minor athlete",
      p_metadata: {
        athlete_id: verification.athlete_id,
        parent_email,
        verification_id: verification.id,
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