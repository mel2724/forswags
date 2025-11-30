import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function AdminConsentMonitoring() {
  const { toast } = useToast();

  // Fetch expiring consents
  const { data: expiringConsents, isLoading: loadingExpiring, refetch: refetchExpiring } = useQuery({
    queryKey: ["expiring-consents"],
    queryFn: async () => {
      const { data: athletesData, error } = await supabase
        .from("athletes")
        .select("id, parent_email, consent_expires_at, public_profile_consent, date_of_birth, user_id")
        .not("consent_expires_at", "is", null)
        .gte("consent_expires_at", new Date().toISOString())
        .lte("consent_expires_at", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()) // Next 60 days
        .order("consent_expires_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = athletesData?.map(a => a.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Merge data
      return athletesData?.map(athlete => ({
        ...athlete,
        profiles: {
          full_name: profilesData?.find(p => p.id === athlete.user_id)?.full_name || 'Unknown',
          email: profilesData?.find(p => p.id === athlete.user_id)?.email || ''
        }
      }));
    }
  });

  // Fetch expired consents
  const { data: expiredConsents, isLoading: loadingExpired } = useQuery({
    queryKey: ["expired-consents"],
    queryFn: async () => {
      const { data: athletesData, error } = await supabase
        .from("athletes")
        .select("id, parent_email, consent_expires_at, public_profile_consent, date_of_birth, user_id")
        .not("consent_expires_at", "is", null)
        .lt("consent_expires_at", new Date().toISOString())
        .order("consent_expires_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = athletesData?.map(a => a.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Merge data
      return athletesData?.map(athlete => ({
        ...athlete,
        profiles: {
          full_name: profilesData?.find(p => p.id === athlete.user_id)?.full_name || 'Unknown',
          email: profilesData?.find(p => p.id === athlete.user_id)?.email || ''
        }
      }));
    }
  });

  // Fetch notification history
  const { data: notificationHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["consent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_renewal_notifications")
        .select(`
          id,
          athlete_id,
          parent_email,
          expires_at,
          notification_type,
          sent_at
        `)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch athlete names separately
      const athleteIds = data?.map(n => n.athlete_id) || [];
      const { data: athletesData } = await supabase
        .from("athletes")
        .select("id, user_id")
        .in("id", athleteIds);
      
      const userIds = athletesData?.map(a => a.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      // Merge data
      return data?.map(notification => {
        const athlete = athletesData?.find(a => a.id === notification.athlete_id);
        const profile = profilesData?.find(p => p.id === athlete?.user_id);
        return {
          ...notification,
          athlete_name: profile?.full_name || 'Unknown'
        };
      });
    }
  });

  const handleSendRenewalEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-consent-renewal-emails");
      
      if (error) throw error;

      toast({
        title: "Emails Sent",
        description: `Processed ${data.processed} consent renewal notifications`,
      });
      
      refetchExpiring();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRunExpirationCheck = async () => {
    try {
      const { error } = await supabase.rpc("check_expired_consents");
      
      if (error) throw error;

      toast({
        title: "Expiration Check Complete",
        description: "Expired consents have been processed",
      });
      
      refetchExpiring();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (expiresAt: string, isConsented: boolean) => {
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />{daysUntilExpiry}d left</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />{daysUntilExpiry}d left</Badge>;
    } else {
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />{daysUntilExpiry}d left</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">COPPA Consent Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage annual consent renewals for minor athletes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSendRenewalEmails} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Send Renewal Emails
          </Button>
          <Button onClick={handleRunExpirationCheck} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Expiration Check
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expiring Soon (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {expiringConsents?.filter(c => {
                const days = Math.ceil((new Date(c.consent_expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return days <= 30;
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {expiredConsents?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {notificationHistory?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Consents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expiring Consents (Next 60 Days)</CardTitle>
          <CardDescription>
            Athletes whose consent will expire in the next 60 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExpiring ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete Name</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Until Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringConsents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No expiring consents in the next 60 days
                    </TableCell>
                  </TableRow>
                ) : (
                  expiringConsents?.map((consent) => (
                    <TableRow key={consent.id}>
                      <TableCell className="font-medium">{consent.profiles.full_name}</TableCell>
                      <TableCell>{consent.parent_email || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(consent.consent_expires_at!), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(consent.consent_expires_at!, consent.public_profile_consent)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(consent.consent_expires_at!), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notification History</CardTitle>
          <CardDescription>
            Last 100 consent renewal notifications sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete Name</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Expiration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationHistory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No notifications sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  notificationHistory?.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {notification.athlete_name || 'N/A'}
                      </TableCell>
                      <TableCell>{notification.parent_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {notification.notification_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(notification.sent_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>{format(new Date(notification.expires_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
