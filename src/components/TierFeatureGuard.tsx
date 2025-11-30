import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { toast } from 'sonner';

interface TierFeatureGuardProps {
  featureKey: string;
  children: ReactNode;
  redirect?: string;
  showToast?: boolean;
}

export function TierFeatureGuard({ 
  featureKey, 
  children, 
  redirect = '/membership',
  showToast = true 
}: TierFeatureGuardProps) {
  const { hasAccess, isLoading } = useFeatureAccess(featureKey);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      if (showToast) {
        toast.error('This feature requires a paid membership', {
          action: {
            label: 'Upgrade',
            onClick: () => navigate(redirect),
          },
        });
      }
      navigate(redirect);
    }
  }, [hasAccess, isLoading, navigate, redirect, showToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
