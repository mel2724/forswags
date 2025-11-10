import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    // Extract token and authenticate user
    const token = authHeader.replace("Bearer ", "");
    logStep("Token extracted, authenticating user");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Authentication failed - returning unsubscribed state", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("No email found - returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      productId = subscription.items.data[0].price.product;
      
      // Safely handle subscription end date with fallback for test mode
      try {
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } else {
          // Fallback for test mode - set 1 year from now
          subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          logStep("Using fallback end date (test mode)", { subscriptionEnd });
        }
      } catch (error) {
        // If date conversion fails, use fallback
        subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        logStep("Date conversion failed, using fallback", { error: error instanceof Error ? error.message : String(error), subscriptionEnd });
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });

      // Map product ID to tier and plan
      let tier = 'free';
      let planName = 'free';
      
      // Recruiter products
      if (productId === 'prod_T9VqwYb5CEEool') {
        tier = 'college_scout';
        planName = 'recruiter_yearly';
      } else if (productId === 'prod_T9Vq2TSF3rfzDp') {
        tier = 'college_scout';
        planName = 'recruiter_monthly';
      }
      // Athlete products
      else if (productId === 'prod_SoqOdBi1QDaZTE') {
        tier = 'premium';
        planName = 'championship_yearly';
      } else if (productId === 'prod_SoqPRCb0fKL4OW') {
        tier = 'premium';
        planName = 'pro_monthly';
      }
      
      logStep("Determined membership tier", { productId, tier, planName });
      
      // Update the database membership record
      const { error: updateError } = await supabaseClient
        .from('memberships')
        .update({
          plan: planName,
          tier: tier,
          status: 'active',
          stripe_subscription_id: subscription.id,
          end_date: subscriptionEnd,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating membership", { error: updateError.message });
      } else {
        logStep("Database updated successfully", { tier, plan: planName, status: 'active' });
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
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
