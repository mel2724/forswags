import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-MANAGE-MEMBERSHIP] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const adminUser = userData.user;
    logStep("User authenticated", { userId: adminUser.id, email: adminUser.email });

    // Verify admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { action, userId, subscriptionId } = await req.json();
    logStep("Action requested", { action, userId, subscriptionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    switch (action) {
      case "get_details": {
        // Get user email
        const { data: profileData, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          throw new Error("User not found");
        }

        // Find customer in Stripe
        const customers = await stripe.customers.list({ email: profileData.email, limit: 1 });
        if (customers.data.length === 0) {
          return new Response(
            JSON.stringify({ error: "No Stripe customer found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        const customer = customers.data[0];
        logStep("Customer found", { customerId: customer.id });

        // Get subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        // Get payment methods
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.id,
          type: "card",
        });

        // Get recent invoices
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 5,
        });

        return new Response(
          JSON.stringify({
            customer: {
              id: customer.id,
              email: customer.email,
              created: customer.created,
            },
            subscriptions: subscriptions.data.map(sub => ({
              id: sub.id,
              status: sub.status,
              current_period_end: sub.current_period_end,
              current_period_start: sub.current_period_start,
              cancel_at_period_end: sub.cancel_at_period_end,
              items: sub.items.data.map(item => ({
                price_id: item.price.id,
                product_id: item.price.product,
                amount: item.price.unit_amount,
                interval: item.price.recurring?.interval,
              })),
            })),
            payment_methods: paymentMethods.data.map(pm => ({
              id: pm.id,
              brand: pm.card?.brand,
              last4: pm.card?.last4,
              exp_month: pm.card?.exp_month,
              exp_year: pm.card?.exp_year,
            })),
            invoices: invoices.data.map(inv => ({
              id: inv.id,
              status: inv.status,
              amount: inv.amount_paid,
              created: inv.created,
              invoice_pdf: inv.invoice_pdf,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "cancel_subscription": {
        if (!subscriptionId) throw new Error("Subscription ID required");

        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        logStep("Subscription canceled", { subscriptionId });

        // Log audit event
        await supabaseClient.from("audit_logs").insert({
          user_id: adminUser.id,
          action: "cancel_subscription",
          resource_type: "subscription",
          metadata: { subscription_id: subscriptionId, target_user_id: userId },
        });

        return new Response(
          JSON.stringify({
            success: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "sync_with_stripe": {
        // Get user email
        const { data: profileData, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          throw new Error("User not found");
        }

        // Find customer in Stripe
        const customers = await stripe.customers.list({ email: profileData.email, limit: 1 });
        if (customers.data.length === 0) {
          return new Response(
            JSON.stringify({ synced: false, reason: "No Stripe customer found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }

        const customer = customers.data[0];
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "active",
          limit: 1,
        });

        let status = "free";
        let productId = null;
        let endDate = null;

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          status = "active";
          productId = sub.items.data[0].price.product as string;
          endDate = new Date(sub.current_period_end * 1000).toISOString();
        }

        // Update membership in database
        const { error: updateError } = await supabaseClient
          .from("memberships")
          .upsert({
            user_id: userId,
            status: status,
            product_id: productId,
            end_date: endDate,
            updated_at: new Date().toISOString(),
          });

        if (updateError) throw updateError;

        logStep("Synced with Stripe", { userId, status, productId });

        return new Response(
          JSON.stringify({
            synced: true,
            status,
            product_id: productId,
            end_date: endDate,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "get_customer_portal": {
        // Get user email
        const { data: profileData, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          throw new Error("User not found");
        }

        // Find customer in Stripe
        const customers = await stripe.customers.list({ email: profileData.email, limit: 1 });
        if (customers.data.length === 0) {
          throw new Error("No Stripe customer found");
        }

        const origin = req.headers.get("origin") || "http://localhost:3000";
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customers.data[0].id,
          return_url: `${origin}/admin/memberships`,
        });

        logStep("Customer portal created", { userId });

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
