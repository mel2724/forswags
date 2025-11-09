import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CreditCard, TrendingUp, Users, DollarSign, ArrowUpDown, Eye, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MembershipDetailsDialog } from "@/components/admin/MembershipDetailsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MembershipData {
  user_id: string;
  email: string;
  full_name: string | null;
  plan: string | null;
  subscribed: boolean;
  subscription_end: string | null;
  created_at: string;
}

type SortField = "email" | "full_name" | "product_id" | "subscription_end" | "created_at";
type SortDirection = "asc" | "desc";

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Stats
  const totalMembers = memberships.length;
  const activeSubscriptions = memberships.filter(m => m.subscribed).length;
  const athleteMembers = memberships.filter(m => 
    m.plan && (m.plan.includes('pro_') || m.plan.includes('championship_'))
  ).length;
  const recruiterMembers = memberships.filter(m => 
    m.plan && m.plan.includes('recruiter_')
  ).length;

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);

      // Fetch all memberships with profile data
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, plan, status, end_date")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles
      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      // Create a map of latest membership per user
      const membershipMap = new Map();
      data?.forEach(m => {
        if (!membershipMap.has(m.user_id)) {
          membershipMap.set(m.user_id, m);
        }
      });

      // Combine data
      const membershipData = Array.from(membershipMap.entries()).map(([userId, membership]) => {
        const profile = profilesMap.get(userId);
        const isActive = membership.status === 'active';
        
        return {
          user_id: userId,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || null,
          plan: membership.plan || null,
          subscribed: isActive,
          subscription_end: membership.end_date || null,
          created_at: profile?.created_at || new Date().toISOString(),
        };
      });

      setMemberships(membershipData);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      toast({
        title: "Error",
        description: "Failed to load memberships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSyncAll = async () => {
    toast({
      title: "Syncing...",
      description: "This may take a moment for all users",
    });

    let synced = 0;
    for (const membership of memberships) {
      try {
        const { data } = await supabase.functions.invoke("admin-manage-membership", {
          body: { action: "sync_with_stripe", userId: membership.user_id },
        });
        if (data?.synced) synced++;
      } catch (error) {
        console.error(`Failed to sync ${membership.email}:`, error);
      }
    }

    toast({
      title: "Sync Complete",
      description: `Synced ${synced} of ${memberships.length} memberships`,
    });

    fetchMemberships();
  };

  const getSortedAndFilteredMemberships = () => {
    let filtered = memberships.filter(
      (m) =>
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply tab filter
    if (activeTab === "active") {
      filtered = filtered.filter(m => m.subscribed);
    } else if (activeTab === "free") {
      filtered = filtered.filter(m => !m.subscribed);
    } else if (activeTab === "issues") {
      filtered = filtered.filter(m => {
        if (!m.subscription_end) return false;
        const daysUntilEnd = Math.ceil((new Date(m.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilEnd <= 7 && daysUntilEnd >= 0;
      });
    }

    return filtered.sort((a, b) => {
      // Map plan to product_id for sorting if needed
      const fieldToSort = sortField === "product_id" ? "plan" : sortField;
      let aValue: any = fieldToSort === "plan" ? a.plan : a[sortField];
      let bValue: any = fieldToSort === "plan" ? b.plan : b[sortField];

      // Handle null values
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Convert to comparable types
      if (sortField === "subscription_end" || sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getMembershipBadge = (membership: MembershipData) => {
    if (!membership.subscribed || !membership.plan) {
      return <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">Free Tier</Badge>;
    }

    const plan = membership.plan;

    if (plan === "pro_monthly") {
      return <Badge className="bg-primary">Pro Monthly</Badge>;
    } else if (plan === "championship_yearly") {
      return <Badge className="bg-secondary">Championship Yearly</Badge>;
    } else if (plan === "recruiter_monthly") {
      return <Badge className="bg-purple-600">Recruiter Monthly</Badge>;
    } else if (plan === "recruiter_yearly") {
      return <Badge className="bg-purple-800">Recruiter Yearly</Badge>;
    } else if (plan === "parent_free") {
      return <Badge variant="secondary">Parent</Badge>;
    }

    // Show the actual plan value for unknown plans
    return <Badge variant="default">{plan}</Badge>;
  };

  const sortedMemberships = getSortedAndFilteredMemberships();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
        <p className="text-muted-foreground">Monitor and manage user subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {totalMembers > 0 ? ((activeSubscriptions / totalMembers) * 100).toFixed(1) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Athletes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athleteMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recruiters</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiterMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>All Memberships</CardTitle>
              <CardDescription>View and manage user memberships</CardDescription>
            </div>
            <Button onClick={handleSyncAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All with Stripe
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading memberships...</div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All ({memberships.length})</TabsTrigger>
                  <TabsTrigger value="active">Active ({activeSubscriptions})</TabsTrigger>
                  <TabsTrigger value="free">Free ({memberships.length - activeSubscriptions})</TabsTrigger>
                  <TabsTrigger value="issues">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Payment Issues
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-2"
                        onClick={() => handleSort("email")}
                      >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-2"
                        onClick={() => handleSort("full_name")}
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-2"
                        onClick={() => handleSort("subscription_end")}
                      >
                        Renewal Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-2"
                        onClick={() => handleSort("created_at")}
                      >
                        Joined
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMemberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No memberships found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedMemberships.map((membership) => (
                      <TableRow key={membership.user_id}>
                        <TableCell className="font-medium">{membership.email}</TableCell>
                        <TableCell>{membership.full_name || "-"}</TableCell>
                        <TableCell>{getMembershipBadge(membership)}</TableCell>
                        <TableCell>
                          {membership.subscribed ? (
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {membership.subscription_end
                            ? new Date(membership.subscription_end).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(membership.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedUser({
                                  id: membership.user_id,
                                  email: membership.email,
                                  name: membership.full_name,
                                })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <MembershipDetailsDialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}
