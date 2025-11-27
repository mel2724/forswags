/**
 * Centralized Stripe Product Configuration
 * Single source of truth for all product IDs across sandbox and production environments
 */

export interface ProductMapping {
  // Athlete products
  pro_monthly: string;
  championship_yearly: string;
  // Recruiter products
  recruiter_monthly: string;
  recruiter_yearly: string;
}

export const STRIPE_PRODUCT_IDS: Record<'sandbox' | 'production', ProductMapping> = {
  sandbox: {
    // Athlete membership products (sandbox)
    pro_monthly: 'prod_TUoekzjBHK03sK',
    championship_yearly: 'prod_TUof9o3BMn9YFH',
    // Recruiter products (sandbox)
    recruiter_monthly: 'prod_T9Vq2TSF3rfzDp',
    recruiter_yearly: 'prod_T9VqwYb5CEEool',
  },
  production: {
    // Athlete membership products (production)
    pro_monthly: 'prod_TF4xtIZXfWy5sa',
    championship_yearly: 'prod_TF4zr2EcShQH1M',
    // Recruiter products (production) - using same as sandbox for now
    recruiter_monthly: 'prod_T9Vq2TSF3rfzDp',
    recruiter_yearly: 'prod_T9VqwYb5CEEool',
  }
};

/**
 * Maps a product ID to its plan name
 * @param productId The Stripe product ID to map
 * @param environment The environment (sandbox or production)
 * @returns The plan name or 'free' if not found
 */
export function mapProductIdToPlan(
  productId: string, 
  environment: 'sandbox' | 'production' = 'sandbox'
): string {
  const products = STRIPE_PRODUCT_IDS[environment];
  
  // Athlete products
  if (productId === products.pro_monthly) return 'pro_monthly';
  if (productId === products.championship_yearly) return 'championship_yearly';
  
  // Recruiter products
  if (productId === products.recruiter_monthly) return 'recruiter_monthly';
  if (productId === products.recruiter_yearly) return 'recruiter_yearly';
  
  // Check opposite environment as fallback (for transition periods)
  const otherEnv = environment === 'sandbox' ? 'production' : 'sandbox';
  const otherProducts = STRIPE_PRODUCT_IDS[otherEnv];
  
  if (productId === otherProducts.pro_monthly) return 'pro_monthly';
  if (productId === otherProducts.championship_yearly) return 'championship_yearly';
  if (productId === otherProducts.recruiter_monthly) return 'recruiter_monthly';
  if (productId === otherProducts.recruiter_yearly) return 'recruiter_yearly';
  
  return 'free';
}

/**
 * Maps a product ID to its tier name
 * @param productId The Stripe product ID to map
 * @param environment The environment (sandbox or production)
 * @returns The tier name or 'free' if not found
 */
export function mapProductIdToTier(
  productId: string,
  environment: 'sandbox' | 'production' = 'sandbox'
): string {
  const products = STRIPE_PRODUCT_IDS[environment];
  
  // Athlete products map to 'premium' tier
  if (productId === products.pro_monthly || productId === products.championship_yearly) {
    return 'premium';
  }
  
  // Recruiter products map to 'college_scout' tier
  if (productId === products.recruiter_monthly || productId === products.recruiter_yearly) {
    return 'college_scout';
  }
  
  // Check opposite environment as fallback
  const otherEnv = environment === 'sandbox' ? 'production' : 'sandbox';
  const otherProducts = STRIPE_PRODUCT_IDS[otherEnv];
  
  if (productId === otherProducts.pro_monthly || productId === otherProducts.championship_yearly) {
    return 'premium';
  }
  
  if (productId === otherProducts.recruiter_monthly || productId === otherProducts.recruiter_yearly) {
    return 'college_scout';
  }
  
  return 'free';
}
