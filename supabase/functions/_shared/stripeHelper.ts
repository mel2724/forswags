/**
 * Stripe Environment Helper
 * Detects the environment based on the request origin and returns the appropriate Stripe key
 */

export async function getStripeKey(req: Request): Promise<string> {
  const origin = req.headers.get("origin") || "";
  
  // Determine environment based on hostname
  const isProduction = origin.includes("www.forswags.com");
  const isSandbox = origin.includes("app.forswags.com");
  
  // Select appropriate Stripe key
  let stripeKey: string | undefined;
  
  if (isProduction) {
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_PRODUCTION");
    console.log("[STRIPE-ENV] Using PRODUCTION Stripe key for:", origin);
  } else if (isSandbox) {
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_SANDBOX");
    console.log("[STRIPE-ENV] Using SANDBOX Stripe key for:", origin);
  } else {
    // Default to sandbox for localhost and other environments
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") || Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[STRIPE-ENV] Using SANDBOX (default) Stripe key for:", origin);
  }
  
  if (!stripeKey) {
    throw new Error("Stripe API key not configured for this environment");
  }
  
  return stripeKey;
}

export function getEnvironmentName(req: Request): "production" | "sandbox" {
  const origin = req.headers.get("origin") || "";
  return origin.includes("www.forswags.com") ? "production" : "sandbox";
}
