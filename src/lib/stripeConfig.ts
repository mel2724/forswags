// Stripe product and price configuration

// SANDBOX (Test Mode) Products - for app.forswags.com
export const STRIPE_PRODUCTS_SANDBOX = {
  evaluation: {
    initial: {
      product_id: "prod_T9YUnaRtZFmxUv",
      price_id: "price_1SDFN9HrmnLSQTHjsbprafBL",
      name: "Skills Evaluation - Initial",
      price: 9700, // $97.00 in cents
      description: "First professional video evaluation from certified coaches"
    },
    reevaluation: {
      product_id: "prod_T9YVEcHLFhJlBY",
      price_id: "price_1SDFO4HrmnLSQTHjLDKxkkMl",
      name: "Skills Evaluation - Re-evaluation",
      price: 4900, // $49.00 in cents
      description: "Re-evaluation for athletes who purchased within the last year"
    }
  },
  membership: {
    athlete: {
      free: {
        product_id: "prod_SoqQeE2QEqQuLf",
        price_id: "price_1RtCjGHrmnLSQTHjPaDyQvRw",
        name: "Free Starter",
        price: 0,
        interval: "month" as const
      },
      monthly: {
        product_id: "prod_SoqPRCb0fKL4OW",
        price_id: "price_1RtCicHrmnLSQTHjfJDtSvOJ",
        name: "Pro Monthly",
        price: 1499, // $14.99 in cents
        interval: "month" as const
      },
      yearly: {
        product_id: "prod_SoqOdBi1QDaZTE",
        price_id: "price_1RtChyHrmnLSQTHjBXPrY7Gc",
        name: "Championship Yearly",
        price: 9700, // $97.00 in cents
        interval: "year" as const
      }
    },
    parent: {
      free: {
        product_id: "parent_free", // Parents get free access with paid athlete account
        price_id: "parent_free",
        name: "Parent Access",
        price: 0,
        interval: "month" as const,
        description: "Free with paid student athlete account"
      }
    },
    recruiter: {
      monthly: {
        product_id: "prod_T9Vq2TSF3rfzDp",
        price_id: "price_1SDCoaHrmnLSQTHjJBk1icEH",
        name: "Recruiter Monthly",
        price: 9700, // $97.00 in cents
        interval: "month" as const
      },
      yearly: {
        product_id: "prod_T9VqwYb5CEEool",
        price_id: "price_1SDComHrmnLSQTHjjn9JOZBr",
        name: "Recruiter Yearly",
        price: 99700, // $997.00 in cents
        interval: "year" as const
      }
    }
  }
} as const;

// PRODUCTION (Live Mode) Products - for www.forswags.com
export const STRIPE_PRODUCTS_PRODUCTION = {
  evaluation: {
    initial: {
      product_id: "prod_TMZr6YzJ6bA3iy",
      price_id: "price_1SPqhPQiODnJ02PJsdjNV3B7",
      name: "Skills Evaluation - Initial",
      price: 9700,
      description: "First professional video evaluation from certified coaches"
    },
    reevaluation: {
      product_id: "prod_TMZqSQaITHcELv",
      price_id: "price_1SPqhFQiODnJ02PJL11bdEKQ",
      name: "Skills Evaluation - Re-evaluation",
      price: 4900,
      description: "Re-evaluation for athletes who purchased within the last year"
    }
  },
  membership: {
    athlete: {
      free: {
        product_id: "prod_TUYYuXrNvpsK0B",
        price_id: "price_1SXZR7QiODnJ02PJiPqpf1uy",
        name: "Free Starter",
        price: 0,
        interval: "month" as const
      },
      monthly: {
        product_id: "prod_TF4xtIZXfWy5sa",
        price_id: "price_1SIanqQiODnJ02PJV1bZBNhH",
        name: "Pro Monthly",
        price: 1499,
        interval: "month" as const
      },
      yearly: {
        product_id: "prod_TF4zr2EcShQH1M",
        price_id: "price_1SIapiQiODnJ02PJot4z8Koy",
        name: "Championship Yearly",
        price: 9700,
        interval: "year" as const
      }
    },
    parent: {
      free: {
        product_id: "prod_TUYrJPWNd36Ger",
        price_id: "price_1SXZjUQiODnJ02PJDVXWpJIR",
        name: "Parent Access",
        price: 0,
        interval: "month" as const,
        description: "Free with paid student athlete account"
      }
    },
    recruiter: {
      monthly: {
        product_id: "prod_TMZrZBV8hx02zr",
        price_id: "price_1SPqhoQiODnJ02PJz3FUFKUV",
        name: "Recruiter Monthly",
        price: 9700,
        interval: "month" as const
      },
      yearly: {
        product_id: "prod_TMZrLjFnDrJODd",
        price_id: "price_1SPqhgQiODnJ02PJUo7p7TR9",
        name: "Recruiter Yearly",
        price: 99700,
        interval: "year" as const
      }
    }
  }
} as const;

// Auto-select products based on current environment
export function getStripeProducts() {
  // Check if we're on production domains (both www and app subdomains)
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname === 'www.forswags.com' || window.location.hostname === 'app.forswags.com');
  
  if (isProduction) {
    console.log('[STRIPE-CONFIG] Using PRODUCTION Stripe products');
    return STRIPE_PRODUCTS_PRODUCTION;
  } else {
    console.log('[STRIPE-CONFIG] Using SANDBOX Stripe products');
    return STRIPE_PRODUCTS_SANDBOX;
  }
}

// Legacy export for backward compatibility (defaults to sandbox)
export const STRIPE_PRODUCTS = STRIPE_PRODUCTS_SANDBOX;

export function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

export function getMembershipTier(productId: string | null): { role: "athlete" | "parent" | "recruiter"; tier: string } | null {
  if (!productId) return null;
  
  // Get current environment's products
  const products = getStripeProducts();
  
  // Athlete tiers
  if (productId === products.membership.athlete.free.product_id) return { role: "athlete", tier: "free" };
  if (productId === products.membership.athlete.monthly.product_id) return { role: "athlete", tier: "monthly" };
  if (productId === products.membership.athlete.yearly.product_id) return { role: "athlete", tier: "yearly" };
  
  // Parent tier
  if (productId === products.membership.parent.free.product_id) return { role: "parent", tier: "free" };
  
  // Recruiter tiers
  if (productId === products.membership.recruiter.monthly.product_id) return { role: "recruiter", tier: "monthly" };
  if (productId === products.membership.recruiter.yearly.product_id) return { role: "recruiter", tier: "yearly" };
  
  return null;
}
