import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess(featureKey: string) {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['feature-access', featureKey, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;

      const { data, error } = await supabase.rpc('has_feature_access', {
        p_user_id: session.user.id,
        p_feature_key: featureKey,
      });

      if (error) {
        console.error('Error checking feature access:', error);
        return false;
      }

      return data as boolean;
    },
    enabled: !!session?.user?.id,
  });

  return {
    hasAccess: hasAccess ?? false,
    isLoading,
  };
}

export function useUserTier() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: tier, isLoading } = useQuery({
    queryKey: ['user-tier', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return 'free';

      const { data, error } = await supabase.rpc('get_user_tier', {
        p_user_id: session.user.id,
      });

      if (error) {
        console.error('Error getting user tier:', error);
        return 'free';
      }

      return (data as string) || 'free';
    },
    enabled: !!session?.user?.id,
  });

  return {
    tier: tier ?? 'free',
    isLoading,
    isFree: tier === 'free',
    isPaid: tier === 'pro_monthly' || tier === 'championship_yearly',
  };
}
