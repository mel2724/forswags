import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistRequest {
  full_name: string;
  email: string;
  sport?: string;
  graduation_year?: number;
  high_school?: string;
  parent_email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const data: WaitlistRequest = await req.json();

    // Validate required fields
    if (!data.full_name || !data.email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate claim token
    const claimToken = crypto.randomUUID();
    const claimTokenExpiresAt = new Date();
    claimTokenExpiresAt.setMonth(claimTokenExpiresAt.getMonth() + 6); // 6 months expiry

    // Insert into waitlist
    const { data: waitlistEntry, error: insertError } = await supabaseClient
      .from("waitlist")
      .insert({
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        sport: data.sport || null,
        graduation_year: data.graduation_year || null,
        high_school: data.high_school || null,
        parent_email: data.parent_email ? data.parent_email.toLowerCase() : null,
        claim_token: claimToken,
        claim_token_expires_at: claimTokenExpiresAt.toISOString(),
        profile_created: false,
        email_sent: false,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate email
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "This email is already on the waitlist" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw insertError;
    }

    console.log("Waitlist entry created:", {
      id: waitlistEntry.id,
      email: data.email,
      claim_token: claimToken,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added to waitlist",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in join-waitlist function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
