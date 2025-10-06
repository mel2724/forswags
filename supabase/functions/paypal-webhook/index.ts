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

// Verify PayPal webhook signature
const verifyPayPalSignature = async (
  headers: Headers, 
  body: string
): Promise<boolean> => {
  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const transmissionSig = headers.get('paypal-transmission-sig');
  const authAlgo = headers.get('paypal-auth-algo');
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo || !webhookId) {
    logStep("Missing webhook signature headers");
    return false;
  }

  try {
    // Calculate SHA-256 hash of the body
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const bodyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Construct the message to verify
    const message = `${transmissionId}|${transmissionTime}|${webhookId}|${bodyHash}`;
    
    // Fetch the certificate from PayPal
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      logStep("Failed to fetch certificate", { status: certResponse.status });
      return false;
    }
    
    const certText = await certResponse.text();
    
    // Import the certificate as a public key
    const pemHeader = "-----BEGIN CERTIFICATE-----";
    const pemFooter = "-----END CERTIFICATE-----";
    const pemContents = certText.substring(
      certText.indexOf(pemHeader) + pemHeader.length,
      certText.indexOf(pemFooter)
    );
    const binaryDer = Uint8Array.from(atob(pemContents.replace(/\s/g, '')), c => c.charCodeAt(0));
    
    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Verify the signature
    const signatureBytes = Uint8Array.from(atob(transmissionSig), c => c.charCodeAt(0));
    const messageBytes = encoder.encode(message);
    
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      messageBytes
    );
    
    logStep("Signature verification completed", { 
      transmissionId, 
      webhookId: webhookId.substring(0, 8) + "...",
      isValid 
    });
    
    return isValid;
  } catch (error) {
    logStep("Signature verification failed", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
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

    const body = await req.text();
    const event = JSON.parse(body);
    
    // Verify PayPal signature
    const isValidSignature = await verifyPayPalSignature(req.headers, body);
    if (!isValidSignature) {
      logStep("Invalid webhook signature - rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
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
