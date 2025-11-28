import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getStripeKey, getEnvironmentName } from "../_shared/stripeHelper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const checkoutRequestSchema = z.object({
  priceId: z.string().min(1, "Price ID is required").startsWith("price_", "Invalid Stripe price ID format"),
  promoCode: z.string().max(50, "Promo code must be less than 50 characters").nullish(),
  returnPath: z.string().optional().default("/membership"),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    // Get Stripe key with detailed error logging
    let stripeKey: string;
    try {
      stripeKey = await getStripeKey(req);
      logStep("Stripe key retrieved successfully");
    } catch (keyError) {
      logStep("ERROR - Failed to get Stripe key", { 
        error: keyError instanceof Error ? keyError.message : String(keyError),
        origin: req.headers.get("origin")
      });
      throw new Error(`Stripe configuration error: ${keyError instanceof Error ? keyError.message : String(keyError)}`);
    }
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: "No authorization header provided",
        error_type: "auth_error"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      const errorType = userError.message.includes("missing sub") 
        ? "token_expired" 
        : "auth_error";
      return new Response(JSON.stringify({ 
        error: `Authentication error: ${userError.message}`,
        error_type: errorType
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ 
        error: "User not authenticated or email not available",
        error_type: "auth_error"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const validationResult = checkoutRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      logStep("Validation failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { priceId, promoCode, returnPath } = validationResult.data;
    const environment = getEnvironmentName(req);
    logStep("Request data", { priceId, promoCode, returnPath, environment });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // DIAGNOSTIC: Verify price exists in Stripe before creating session
    try {
      const price = await stripe.prices.retrieve(priceId);
      logStep("Price verification successful", { 
        priceId, 
        productId: price.product,
        active: price.active,
        currency: price.currency,
        unitAmount: price.unit_amount,
        recurring: price.recurring 
      });
      
      if (!price.active) {
        throw new Error(`Price ${priceId} is inactive in Stripe`);
      }
    } catch (priceError) {
      logStep("ERROR - Price verification failed", { 
        priceId, 
        error: priceError instanceof Error ? priceError.message : String(priceError) 
      });
      throw new Error(`Invalid price ID ${priceId}: ${priceError instanceof Error ? priceError.message : 'Price not found'}`);
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Create checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}${returnPath}?subscription=success`,
      cancel_url: `${req.headers.get("origin")}${returnPath}?subscription=canceled`,
      metadata: {
        user_id: user.id,
      },
    };

    // Apply promo code if provided
    if (promoCode) {
      logStep("Validating promo code", { promoCode });
      
      // Get price details to get product_id
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      
      // Validate promo code via database function
      const { data: validationResult, error: validationError } = await supabaseClient
        .rpc('validate_promo_code', { 
          p_code: promoCode,
          p_product_id: productId
        });

      if (validationError) {
        logStep("Promo code validation error", { error: validationError });
        throw new Error("Error validating promo code");
      }

      if (!validationResult.valid) {
        logStep("Invalid promo code", { error: validationResult.error });
        throw new Error(validationResult.error || "Invalid promo code");
      }

      logStep("Promo code valid", { validation: validationResult });

      // Use persistent coupon ID (no timestamp)
      const couponId = `promo_${validationResult.code}`;
      let coupon: Stripe.Coupon;

      // Try to retrieve existing coupon first
      try {
        coupon = await stripe.coupons.retrieve(couponId);
        logStep("Retrieved existing Stripe coupon", { couponId: coupon.id });
      } catch (retrieveError: any) {
        // Only create if coupon doesn't exist
        if (retrieveError?.type === 'StripeInvalidRequestError' && retrieveError?.code === 'resource_missing') {
          logStep("Coupon not found, creating new one", { couponId });
          
          const couponParams: Stripe.CouponCreateParams = validationResult.discount_type === 'percentage'
            ? { percent_off: validationResult.discount_value, duration: 'once', id: couponId }
            : { amount_off: Math.round(validationResult.discount_value * 100), currency: 'usd', duration: 'once', id: couponId };
          
          coupon = await stripe.coupons.create(couponParams);
          logStep("Created new Stripe coupon", { couponId: coupon.id });
        } else {
          logStep("Error retrieving coupon", { error: retrieveError });
          throw retrieveError;
        }
      }
      
      sessionConfig.discounts = [{ coupon: coupon.id }];
      
      // Store promo code metadata for tracking
      sessionConfig.metadata!.promo_code_id = validationResult.id;
      sessionConfig.metadata!.discount_amount = validationResult.discount_value;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    // Determine error type for frontend handling
    const errorType = errorMessage.includes("Stripe API key") || errorMessage.includes("not configured")
      ? "config_error" 
      : errorMessage.includes("authenticated") || errorMessage.includes("authorization")
      ? "auth_error"
      : errorMessage.includes("network") || errorMessage.includes("fetch")
      ? "network_error"
      : "unknown_error";
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      error_type: errorType 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
