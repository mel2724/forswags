import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Twitter, Instagram, Link as LinkIcon, Users } from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  updated_at: string;
}

export const SocialAccountsManager = () => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch connected accounts status (no access tokens exposed to client)
  const { data: accounts, isLoading, error: queryError } = useQuery({
    queryKey: ["connected-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connected_accounts_status")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as SocialAccount[];
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const platform = sessionStorage.getItem('oauth_platform');

      if (code && platform) {
        try {
          const redirectUri = `${window.location.origin}${window.location.pathname}`;
          const functionName = platform === 'twitter' ? 'twitter-oauth-callback' : 'instagram-oauth-callback';
          
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: { code, redirectUri }
          });

          if (error) throw error;

          toast.success(`Connected to ${platform} as @${data.username || data.accountId}`);
          queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
          sessionStorage.removeItem('oauth_platform');
          
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error("Failed to complete OAuth flow");
        }
      }
    };

    handleCallback();
  }, [queryClient]);

  // Start OAuth flow
  const startOAuthFlow = async (platform: 'twitter' | 'instagram') => {
    try {
      setIsConnecting(true);
      sessionStorage.setItem('oauth_platform', platform);
      
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const functionName = platform === 'twitter' ? 'twitter-oauth-start' : 'instagram-oauth-start';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { redirectUri }
      });

      if (error) throw error;

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('OAuth start error:', error);
      toast.error("Failed to start OAuth flow");
      setIsConnecting(false);
    }
  };

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("connected_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      toast.success("Account disconnected");
    },
    onError: (error) => {
      toast.error("Disconnection failed: " + error.message);
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queryError) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">Failed to load accounts</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["connected-accounts"] })}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts using OAuth for seamless posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => startOAuthFlow('twitter')}
            disabled={isConnecting}
            variant="outline"
            className="w-full"
          >
            <Twitter className="h-4 w-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect Twitter"}
          </Button>
          <Button
            onClick={() => startOAuthFlow('instagram')}
            disabled={isConnecting}
            variant="outline"
            className="w-full"
          >
            <Instagram className="h-4 w-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect Instagram"}
          </Button>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-medium">Connected Accounts</h3>
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">@{account.account_name}</p>
                          <Badge variant="secondary" className="text-xs">
                            <LinkIcon className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.platform}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccountMutation.mutate(account.id)}
                      disabled={deleteAccountMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No accounts connected yet</p>
            <p className="text-xs mt-1">Connect your first account to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialAccountsManager;
