import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripeKey } from "../_shared/stripeHelper.ts";

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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[CREATE-EVALUATION-PAYMENT] Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log("[CREATE-EVALUATION-PAYMENT] User authenticated:", user.email);

    const { video_url, previous_evaluation_id } = await req.json();

    if (!video_url) {
      throw new Error("Video URL is required");
    }

    // Initialize Stripe with environment-aware key
    const stripeKey = await getStripeKey(req);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-EVALUATION-PAYMENT] Existing customer found:", customerId);
    } else {
      console.log("[CREATE-EVALUATION-PAYMENT] No existing customer");
    }

    // Get athlete_id for the user
    const { data: athleteData } = await supabaseClient
      .from("athletes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!athleteData) {
      throw new Error("Athlete profile not found");
    }

    console.log("[CREATE-EVALUATION-PAYMENT] Athlete found:", athleteData.id);

    // Check if athlete can request re-evaluation (2 months since last)
    const { data: canReevalData, error: reevalError } = await supabaseClient
      .rpc("can_request_reevaluation", { p_athlete_id: athleteData.id });

    if (reevalError) {
      console.error("[CREATE-EVALUATION-PAYMENT] Error checking re-evaluation eligibility:", reevalError);
      throw new Error("Cannot check re-evaluation eligibility");
    }

    if (!canReevalData) {
      throw new Error("You must wait 2 months between evaluations");
    }

    // Determine if this is a re-evaluation
    const isReevaluation = Boolean(previous_evaluation_id);
    
    // Get tier-based pricing for this user
    const { data: priceInCents, error: priceError } = await supabaseClient
      .rpc("get_user_evaluation_price", { 
        p_user_id: user.id,
        p_is_reevaluation: isReevaluation
      });

    if (priceError) {
      console.error("[CREATE-EVALUATION-PAYMENT] Error getting price:", priceError);
      throw new Error("Cannot determine pricing");
    }

    console.log("[CREATE-EVALUATION-PAYMENT] Price (cents):", priceInCents, "Is re-evaluation:", isReevaluation);

    // Get previous coach if this is a re-evaluation
    let previousCoachId = null;
    if (previous_evaluation_id) {
      const { data: prevEval } = await supabaseClient
        .from("evaluations")
        .select("coach_id")
        .eq("id", previous_evaluation_id)
        .single();
      
      if (prevEval?.coach_id) {
        previousCoachId = prevEval.coach_id;
      }
    }

    // Create a checkout session for evaluation payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isReevaluation ? 'Skills Evaluation - Re-evaluation' : 'Skills Evaluation - Initial',
              description: isReevaluation 
                ? 'Re-evaluation from certified coaches'
                : 'First professional video evaluation from certified coaches'
            },
            unit_amount: priceInCents as number,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/evaluations/purchase?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/evaluations?canceled=true`,
      metadata: {
        athlete_id: athleteData.id,
        video_url: video_url,
        user_id: user.id,
        is_reevaluation: isReevaluation.toString(),
        previous_evaluation_id: previous_evaluation_id || "",
        requested_coach_id: previousCoachId || "",
      },
    });

    console.log("[CREATE-EVALUATION-PAYMENT] Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[CREATE-EVALUATION-PAYMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
