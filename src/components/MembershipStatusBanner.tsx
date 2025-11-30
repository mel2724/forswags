import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, XCircle } from "lucide-react";

interface MembershipStatus {
  status: string;
  tier: string;
  end_date?: string;
  days_until_renewal?: number;
  needs_renewal: boolean;
  is_urgent: boolean;
  is_critical: boolean;
}

export function MembershipStatusBanner() {
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkMembershipStatus();
  }, []);

  const checkMembershipStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_membership_status', {
        p_user_id: user.id
      });

      if (error) throw error;
      setStatus(data as unknown as MembershipStatus);
    } catch (error) {
      console.error('Error checking membership status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) return null;

  // Don't show banner for free tier or if no renewal needed
  if (status.tier === 'free' || !status.needs_renewal) return null;

  const getBannerVariant = () => {
    if (status.is_critical) return "destructive";
    if (status.is_urgent) return "default";
    return "default";
  };

  const getIcon = () => {
    if (status.is_critical) return <XCircle className="h-5 w-5" />;
    if (status.is_urgent) return <AlertCircle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  const getMessage = () => {
    if (status.is_critical) {
      return `Your membership expires in ${status.days_until_renewal} day${status.days_until_renewal === 1 ? '' : 's'}! Renew now to avoid losing access.`;
    }
    if (status.is_urgent) {
      return `Your membership expires in ${status.days_until_renewal} days. Renew soon to maintain uninterrupted access.`;
    }
    return `Your membership expires in ${status.days_until_renewal} days.`;
  };

  return (
    <Alert variant={getBannerVariant()} className="mb-4">
      {getIcon()}
      <AlertTitle className="ml-2">Membership Renewal Reminder</AlertTitle>
      <AlertDescription className="ml-2 mt-2">
        {getMessage()}
        <Button
          variant={status.is_critical ? "default" : "outline"}
          size="sm"
          className="ml-4"
          onClick={() => navigate('/membership')}
        >
          Renew Membership
        </Button>
      </AlertDescription>
    </Alert>
  );
}
