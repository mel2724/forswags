// Stripe product and price configuration
export const STRIPE_PRODUCTS = {
  evaluation: {
    product_id: "prod_T9V29POiUTqS3Y",
    price_id: "price_1SDC24HrmnLSQTHjzkDq4BQs",
    name: "Skills Evaluation",
    price: 9900, // $99.00 in cents
    description: "A review of your highlight reel and feedback from a seasoned coach"
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

export function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

export function getMembershipTier(productId: string | null): { role: "athlete" | "parent" | "recruiter"; tier: string } | null {
  if (!productId) return null;
  
  // Athlete tiers
  if (productId === STRIPE_PRODUCTS.membership.athlete.free.product_id) return { role: "athlete", tier: "free" };
  if (productId === STRIPE_PRODUCTS.membership.athlete.monthly.product_id) return { role: "athlete", tier: "monthly" };
  if (productId === STRIPE_PRODUCTS.membership.athlete.yearly.product_id) return { role: "athlete", tier: "yearly" };
  
  // Parent tier
  if (productId === STRIPE_PRODUCTS.membership.parent.free.product_id) return { role: "parent", tier: "free" };
  
  // Recruiter tiers
  if (productId === STRIPE_PRODUCTS.membership.recruiter.monthly.product_id) return { role: "recruiter", tier: "monthly" };
  if (productId === STRIPE_PRODUCTS.membership.recruiter.yearly.product_id) return { role: "recruiter", tier: "yearly" };
  
  return null;
}
