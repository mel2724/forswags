/**
 * Stripe Environment Helper
 * Detects the environment based on the request origin and returns the appropriate Stripe key
 */

export async function getStripeKey(req: Request): Promise<string> {
  const origin = req.headers.get("origin") || "";
  console.log("[STRIPE-ENV] Request origin:", origin);
  
  // Determine environment based on hostname
  const isProduction = origin.includes("www.forswags.com");
  const isSandbox = origin.includes("app.forswags.com") || 
                    origin.includes("lovable.app") ||
                    origin.includes("localhost");
  
  // Select appropriate Stripe key
  let stripeKey: string | undefined;
  let environment: string;
  
  if (isProduction) {
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_PRODUCTION");
    environment = "PRODUCTION";
    console.log("[STRIPE-ENV] Using PRODUCTION Stripe key for:", origin);
  } else if (isSandbox) {
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_SANDBOX");
    environment = "SANDBOX (explicit)";
    console.log("[STRIPE-ENV] Using SANDBOX Stripe key for:", origin);
  } else {
    // Default to sandbox for any other environment
    stripeKey = Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") || Deno.env.get("STRIPE_SECRET_KEY");
    environment = "SANDBOX (default)";
    console.log("[STRIPE-ENV] Using SANDBOX (default) Stripe key for:", origin);
  }
  
  if (!stripeKey) {
    console.error("[STRIPE-ENV] No Stripe key found! Key availability:", {
      hasProduction: !!Deno.env.get("STRIPE_SECRET_KEY_PRODUCTION"),
      hasSandbox: !!Deno.env.get("STRIPE_SECRET_KEY_SANDBOX"),
      hasDefault: !!Deno.env.get("STRIPE_SECRET_KEY"),
      origin,
      environment,
    });
    throw new Error("Stripe API key not configured for this environment");
  }
  
  console.log("[STRIPE-ENV] Successfully retrieved Stripe key for environment:", environment);
  return stripeKey;
}

export function getEnvironmentName(req: Request): "production" | "sandbox" {
  const origin = req.headers.get("origin") || "";
  return origin.includes("www.forswags.com") ? "production" : "sandbox";
}
