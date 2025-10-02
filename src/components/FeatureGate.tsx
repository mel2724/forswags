import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

export function FeatureGate({ featureKey, children, fallback, featureName }: FeatureGateProps) {
  const { hasAccess, isLoading } = useFeatureAccess(featureKey);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle>Upgrade Required</CardTitle>
                <CardDescription>
                  {featureName ? `${featureName} is` : 'This feature is'} only available for paid members
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unlock premium features including analytics, college matching, rankings, and more with a paid membership.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/membership')}>
                View Membership Plans
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
