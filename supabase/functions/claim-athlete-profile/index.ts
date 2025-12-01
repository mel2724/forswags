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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { claim_token, password } = await req.json();

    if (!claim_token || !password) {
      throw new Error("Claim token and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    console.log("[CLAIM-PROFILE] Validating claim token");

    // Find athlete or alumni by claim token
    const { data: athleteData, error: athleteError } = await supabaseClient
      .from("athletes")
      .select("id, user_id, profile_claimed, claim_token_expires_at")
      .eq("claim_token", claim_token)
      .maybeSingle();

    const { data: alumniData, error: alumniError } = await supabaseClient
      .from("alumni")
      .select("id, user_id, profile_claimed, claim_token_expires_at")
      .eq("claim_token", claim_token)
      .maybeSingle();

    const profileData = athleteData || alumniData;
    const tableName = athleteData ? "athletes" : "alumni";

    if (!profileData) {
      throw new Error("Invalid or expired claim link");
    }

    if (profileData.profile_claimed) {
      throw new Error("This profile has already been claimed");
    }

    if (new Date(profileData.claim_token_expires_at) < new Date()) {
      throw new Error("This claim link has expired");
    }

    console.log(`[CLAIM-PROFILE] Claiming ${tableName} profile:`, profileData.id);

    // Update user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      profileData.user_id,
      { password }
    );

    if (updateError) {
      console.error("[CLAIM-PROFILE] Password update error:", updateError);
      throw new Error("Failed to update password");
    }

    // Mark profile as claimed
    const { error: claimError } = await supabaseClient
      .from(tableName)
      .update({
        profile_claimed: true,
        claim_token: null,
        claim_token_expires_at: null,
      })
      .eq("id", profileData.id);

    if (claimError) {
      console.error("[CLAIM-PROFILE] Profile update error:", claimError);
      throw new Error("Failed to claim profile");
    }

    console.log("[CLAIM-PROFILE] Profile claimed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: profileData.user_id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[CLAIM-PROFILE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
