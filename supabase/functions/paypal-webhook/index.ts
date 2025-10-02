import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYPAL-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    const event = await req.json();
    logStep("Event type", { type: event.event_type });

    // Handle different PayPal webhook events
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.UPDATED": {
        const subscription = event.resource;
        const userId = subscription.custom_id;
        
        if (!userId) {
          logStep("No user ID found in subscription");
          break;
        }

        logStep("Processing subscription activation", { userId, subscriptionId: subscription.id });

        // Update or create membership
        const { error: membershipError } = await supabaseClient
          .from("memberships")
          .upsert({
            user_id: userId,
            plan: subscription.plan_id.includes("monthly") ? "pro_monthly" : "championship_yearly",
            status: "active",
            stripe_subscription_id: subscription.id, // Reusing this field for PayPal
            start_date: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (membershipError) {
          logStep("Error updating membership", { error: membershipError });
        } else {
          logStep("Membership activated successfully");
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subscription = event.resource;
        const userId = subscription.custom_id;
        
        if (!userId) {
          logStep("No user ID found in subscription");
          break;
        }

        logStep("Processing subscription cancellation", { userId, subscriptionId: subscription.id });

        // Update membership to inactive
        const { error: membershipError } = await supabaseClient
          .from("memberships")
          .update({
            status: "cancelled",
            end_date: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("stripe_subscription_id", subscription.id);

        if (membershipError) {
          logStep("Error updating membership", { error: membershipError });
        } else {
          logStep("Membership cancelled successfully");
        }
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        const sale = event.resource;
        logStep("Payment completed", { saleId: sale.id, amount: sale.amount });
        // Payment tracking can be added here if needed
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.event_type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
