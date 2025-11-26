import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripeKey, getEnvironmentName } from "../_shared/stripeHelper.ts";

// Helper to get webhook secret based on environment
function getWebhookSecret(req: Request): string {
  const origin = req.headers.get("origin") || "";
  const isProduction = origin.includes("www.forswags.com");
  
  const secret = isProduction 
    ? Deno.env.get("STRIPE_WEBHOOK_SECRET_PRODUCTION")
    : Deno.env.get("STRIPE_WEBHOOK_SECRET_SANDBOX") || Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!secret) {
    throw new Error("Stripe webhook secret not configured for this environment");
  }
  
  console.log(`[WEBHOOK] Using ${isProduction ? 'PRODUCTION' : 'SANDBOX'} webhook secret`);
  return secret;
}

// Environment-aware product ID mapping
const PRODUCT_ID_MAP = {
  sandbox: {
    pro_monthly: 'prod_SoqPRCb0fKL4OW',
    championship_yearly: 'prod_SoqOdBi1QDaZTE'
  },
  production: {
    pro_monthly: 'prod_TF4xtIZXfWy5sa',
    championship_yearly: 'prod_TF4zr2EcShQH1M'
  }
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  // Initialize Stripe with environment-aware key
  const stripeKey = await getStripeKey(req);
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
  });

  let event;
  try {
    const webhookSecret = getWebhookSecret(req);
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }
  
  const environment = getEnvironmentName(req);
  const productMap = PRODUCT_ID_MAP[environment];

  console.log("Processing webhook event:", event.type);

  try {
    switch (event.type) {
      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: customer } = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          const user = authData?.users.find(u => u.email === email);
          
          if (user) {
            // Archive user data including all media before downgrade
            await supabase.rpc('archive_user_data', { p_user_id: user.id });
            
            console.log(`Archived all data and media for user ${user.id}`);

            // Update membership to free tier
            await supabase
              .from('memberships')
              .update({
                plan: 'free',
                status: 'active',
                payment_failed_at: event.type === 'invoice.payment_failed' ? new Date().toISOString() : null,
              })
              .eq('user_id', user.id)
              .eq('stripe_subscription_id', subscription.id);

            console.log(`Downgraded user ${user.id} to free tier`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: customer } = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (email && subscription.status === 'active') {
          const { data: authData } = await supabase.auth.admin.listUsers();
          const user = authData?.users.find(u => u.email === email);
          
          if (user) {
            const productId = subscription.items.data[0].price.product as string;
            
            // Map product ID to plan using environment-aware mapping
            let plan = 'free';
            if (productId === productMap.pro_monthly) plan = 'pro_monthly';
            if (productId === productMap.championship_yearly) plan = 'championship_yearly';
            
            console.log(`[WEBHOOK] Product ID ${productId} mapped to plan: ${plan}`);

            // Check if upgrading from free
            const { data: currentMembership } = await supabase
              .from('memberships')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (currentMembership?.plan === 'free' && plan !== 'free') {
              // Restore archived data if within 6 months
              const archivedData = currentMembership.archived_data as any;
              if (archivedData?.restore_until) {
                const restoreUntil = new Date(archivedData.restore_until);
                if (new Date() < restoreUntil) {
                  // Restore college matches
                  if (archivedData.college_matches) {
                    for (const match of archivedData.college_matches) {
                      await supabase.from('college_matches').insert(match);
                    }
                  }
                  // Restore profile views
                  if (archivedData.profile_views) {
                    for (const view of archivedData.profile_views) {
                      await supabase.from('profile_views').insert(view);
                    }
                  }
                  console.log(`Restored archived data for user ${user.id}`);
                }
              }
            }

            // Update membership
            await supabase
              .from('memberships')
              .upsert({
                user_id: user.id,
                plan,
                status: 'active',
                stripe_subscription_id: subscription.id,
                start_date: new Date(subscription.current_period_start * 1000).toISOString(),
                end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                payment_failed_at: null,
              });

            console.log(`Updated membership for user ${user.id} to ${plan}`);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
    });
  }
});
