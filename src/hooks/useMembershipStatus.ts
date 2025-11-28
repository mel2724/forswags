import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MembershipStatus {
  status: string;
  tier: string;
  end_date?: string;
  days_until_renewal?: number;
  needs_renewal: boolean;
  is_urgent: boolean;
  is_critical: boolean;
}

export function useMembershipStatus() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['membership-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase.rpc('get_membership_status', {
        p_user_id: session.user.id,
      });

      if (error) {
        console.error('Error checking membership status:', error);
        return null;
      }

      return data as unknown as MembershipStatus;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    status,
    isLoading,
    refetch,
    isFree: status?.tier === 'free',
    canUploadVideo: status?.tier !== 'free' || !status?.needs_renewal,
  };
}
