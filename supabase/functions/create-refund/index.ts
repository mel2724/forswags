import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getStripeKey } from "../_shared/stripeHelper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-REFUND] ${step}${detailsStr}`);
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
    logStep("Function started");

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser?.id) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin authenticated", { adminId: adminUser.id });

    const { payment_intent_id, amount, reason, user_id } = await req.json();
    if (!payment_intent_id) throw new Error("Payment intent ID is required");
    if (!user_id) throw new Error("User ID is required");
    logStep("Request data", { payment_intent_id, amount, reason, user_id });

    // Initialize Stripe with environment-aware key
    const stripeKey = await getStripeKey(req);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create refund in Stripe
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment_intent_id,
      reason: reason || undefined,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundParams);
    logStep("Stripe refund created", { refundId: refund.id, status: refund.status, amount: refund.amount });

    // Record refund in database
    const { data: refundRecord, error: dbError } = await supabaseClient
      .from("refunds")
      .insert({
        stripe_refund_id: refund.id,
        stripe_payment_intent_id: payment_intent_id,
        user_id: user_id,
        amount: refund.amount / 100, // Store in dollars
        reason: reason || null,
        status: refund.status,
        processed_by: adminUser.id,
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", { error: dbError });
      throw new Error(`Failed to record refund: ${dbError.message}`);
    }

    logStep("Refund recorded in database", { refundRecordId: refundRecord.id });

    return new Response(JSON.stringify({
      success: true,
      refund_id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
