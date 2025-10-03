import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYPAL-PLANS] ${step}${detailsStr}`);
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
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    logStep("Got PayPal access token");

    // Step 1: Create a product
    const productResponse = await fetch("https://api-m.paypal.com/v1/catalogs/products", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ForSWAGs Membership",
        description: "Premium membership plans for ForSWAGs athletes",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    });

    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      logStep("PayPal product creation error", { error: errorData });
      throw new Error(`PayPal product creation error: ${JSON.stringify(errorData)}`);
    }

    const product = await productResponse.json();
    logStep("PayPal product created", { productId: product.id });

    // Step 2: Create monthly billing plan
    const monthlyPlanResponse = await fetch("https://api-m.paypal.com/v1/billing/plans", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: product.id,
        name: "Pro Monthly",
        description: "Monthly subscription for ForSWAGs Pro membership",
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // 0 means indefinite
            pricing_scheme: {
              fixed_price: {
                value: "97.00",
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: "0",
            currency_code: "USD",
          },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });

    if (!monthlyPlanResponse.ok) {
      const errorData = await monthlyPlanResponse.json();
      logStep("PayPal monthly plan creation error", { error: errorData });
      throw new Error(`PayPal monthly plan creation error: ${JSON.stringify(errorData)}`);
    }

    const monthlyPlan = await monthlyPlanResponse.json();
    logStep("PayPal monthly plan created", { planId: monthlyPlan.id });

    // Step 3: Create yearly billing plan
    const yearlyPlanResponse = await fetch("https://api-m.paypal.com/v1/billing/plans", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: product.id,
        name: "Championship Yearly",
        description: "Annual subscription for ForSWAGs Championship membership",
        billing_cycles: [
          {
            frequency: {
              interval_unit: "YEAR",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // 0 means indefinite
            pricing_scheme: {
              fixed_price: {
                value: "497.00",
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: "0",
            currency_code: "USD",
          },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });

    if (!yearlyPlanResponse.ok) {
      const errorData = await yearlyPlanResponse.json();
      logStep("PayPal yearly plan creation error", { error: errorData });
      throw new Error(`PayPal yearly plan creation error: ${JSON.stringify(errorData)}`);
    }

    const yearlyPlan = await yearlyPlanResponse.json();
    logStep("PayPal yearly plan created", { planId: yearlyPlan.id });

    return new Response(JSON.stringify({ 
      success: true,
      product_id: product.id,
      monthly_plan_id: monthlyPlan.id,
      yearly_plan_id: yearlyPlan.id,
      message: "PayPal plans created successfully. Update your code with these Plan IDs."
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
