import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Star, Users, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  is_primary: boolean;
  follower_count: number;
  connected_at: string;
}

export const SocialAccountsManager = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as SocialAccount[];
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If tokens are provided, encrypt them (for future OAuth integration)
      let insertData: any = {
        user_id: user.id,
        ...accountData,
      };

      // Remove plain tokens and add encrypted ones if tokens exist
      if (accountData.access_token || accountData.refresh_token) {
        const { data: encryptedAccess, error: encryptError } = await supabase.rpc(
          'encrypt_oauth_token',
          { token: accountData.access_token || '' }
        );
        
        const { data: encryptedRefresh, error: refreshError } = await supabase.rpc(
          'encrypt_oauth_token',
          { token: accountData.refresh_token || '' }
        );

        if (encryptError || refreshError) {
          throw new Error('Failed to encrypt tokens');
        }

        // Remove plain text tokens and add encrypted ones
        const { access_token, refresh_token, ...rest } = insertData;
        insertData = {
          ...rest,
          encrypted_access_token: encryptedAccess,
          encrypted_refresh_token: encryptedRefresh,
        };
      }

      const { error } = await supabase
        .from('connected_accounts')
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast.success('Account connected successfully!');
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to connect account: ' + error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast.success('Account disconnected');
    },
    onError: (error) => {
      toast.error('Failed to disconnect account: ' + error.message);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, unset all primary accounts
      await supabase
        .from('social_accounts')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Then set the new primary
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_primary: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast.success('Primary account updated');
    },
  });

  const resetForm = () => {
    setPlatform("");
    setUsername("");
  };

  const handleAddAccount = () => {
    if (!platform || !username.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    addAccountMutation.mutate({
      platform,
      username: username.trim(),
      is_primary: !accounts || accounts.length === 0,
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading accounts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Manage your social media accounts for posting</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Social Account</DialogTitle>
                <DialogDescription>
                  Add a social media account to manage posts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username/Handle</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@yourusername"
                  />
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p>⚠️ Note: Full platform integration coming soon. For now, this tracks your accounts for reference.</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAccount} disabled={addAccountMutation.isPending}>
                    Connect
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts && accounts.length > 0 ? (
            accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.username}</p>
                          {account.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="mr-1 h-3 w-3" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.platform} • {account.follower_count.toLocaleString()} followers
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!account.is_primary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryMutation.mutate(account.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAccountMutation.mutate(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No accounts connected yet</p>
              <p className="text-xs mt-1">Connect your social media accounts to manage posts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};