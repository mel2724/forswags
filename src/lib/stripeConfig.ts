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
    free: {
      product_id: "prod_SoqQeE2QEqQuLf",
      price_id: "price_1RtCjGHrmnLSQTHjPaDyQvRw",
      name: "Free Basic Membership",
      price: 0,
      interval: "month" as const
    },
    monthly: {
      product_id: "prod_SoqPRCb0fKL4OW",
      price_id: "price_1RtCicHrmnLSQTHjfJDtSvOJ",
      name: "Monthly Elite Membership",
      price: 1499, // $14.99 in cents
      interval: "month" as const
    },
    yearly: {
      product_id: "prod_SoqOdBi1QDaZTE",
      price_id: "price_1RtChyHrmnLSQTHjBXPrY7Gc",
      name: "Yearly Elite Membership",
      price: 9700, // $97.00 in cents
      interval: "year" as const
    }
  }
} as const;

export function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

export function getMembershipTier(productId: string | null): "free" | "monthly" | "yearly" | null {
  if (!productId) return null;
  
  if (productId === STRIPE_PRODUCTS.membership.free.product_id) return "free";
  if (productId === STRIPE_PRODUCTS.membership.monthly.product_id) return "monthly";
  if (productId === STRIPE_PRODUCTS.membership.yearly.product_id) return "yearly";
  
  return null;
}
