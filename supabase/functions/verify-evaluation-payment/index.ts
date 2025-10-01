import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    console.log("[VERIFY-EVALUATION-PAYMENT] Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    console.log("[VERIFY-EVALUATION-PAYMENT] Verifying session:", session_id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log("[VERIFY-EVALUATION-PAYMENT] Session status:", session.payment_status);

    if (session.payment_status === "paid") {
      const metadata = session.metadata;

      // Create evaluation record
      const { data: evaluation, error: evalError } = await supabaseClient
        .from("evaluations")
        .insert({
          athlete_id: metadata!.athlete_id,
          video_url: metadata!.video_url,
          status: "pending",
        })
        .select()
        .single();

      if (evalError) {
        console.error("[VERIFY-EVALUATION-PAYMENT] Error creating evaluation:", evalError);
        throw evalError;
      }

      console.log("[VERIFY-EVALUATION-PAYMENT] Evaluation created:", evaluation.id);

      // Notify coaches about new evaluation
      await supabaseClient.functions.invoke('notify-coaches-new-evaluation', {
        body: { evaluation_id: evaluation.id }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          evaluation_id: evaluation.id 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[VERIFY-EVALUATION-PAYMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
