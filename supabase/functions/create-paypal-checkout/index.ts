import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const paypalCheckoutRequestSchema = z.object({
  plan: z.string().min(1, "PayPal plan ID is required"),
  price: z.number().positive("Price must be positive"),
  interval: z.enum(['monthly', 'yearly'], { errorMap: () => ({ message: "Interval must be monthly or yearly" }) }),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYPAL-CHECKOUT] ${step}${detailsStr}`);
};

// Get PayPal access token
async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
  
  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${secret}`);
  
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const validationResult = paypalCheckoutRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      logStep("Validation failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { plan, price, interval } = validationResult.data;
    logStep("Request data", { plan, price, interval });

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    logStep("Got PayPal access token");

    // Create PayPal subscription
    const paypalResponse = await fetch("https://api-m.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: plan, // This should be a PayPal plan ID
        quantity: "1",
        subscriber: {
          email_address: user.email,
        },
        application_context: {
          brand_name: "ForSWAGs",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
          },
          return_url: `${req.headers.get("origin")}/membership?payment=success&provider=paypal`,
          cancel_url: `${req.headers.get("origin")}/membership?payment=canceled`,
        },
        custom_id: user.id, // Store user ID for webhook processing
      }),
    });

    if (!paypalResponse.ok) {
      const errorData = await paypalResponse.json();
      logStep("PayPal API error", { error: errorData });
      throw new Error(`PayPal API error: ${JSON.stringify(errorData)}`);
    }

    const subscription = await paypalResponse.json();
    logStep("PayPal subscription created", { subscriptionId: subscription.id });

    // Find approval URL
    const approvalUrl = subscription.links.find((link: any) => link.rel === "approve")?.href;
    
    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal response");
    }

    return new Response(JSON.stringify({ 
      url: approvalUrl,
      subscription_id: subscription.id 
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
