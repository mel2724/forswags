import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CreditCard, TrendingUp, Users, DollarSign, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { STRIPE_PRODUCTS, formatPrice, getMembershipTier } from "@/lib/stripeConfig";

interface MembershipData {
  user_id: string;
  email: string;
  full_name: string | null;
  product_id: string | null;
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
  const { toast } = useToast();

  // Stats
  const totalMembers = memberships.length;
  const activeSubscriptions = memberships.filter(m => m.subscribed).length;
  const athleteMembers = memberships.filter(m => {
    const tier = getMembershipTier(m.product_id);
    return tier?.role === "athlete";
  }).length;
  const recruiterMembers = memberships.filter(m => {
    const tier = getMembershipTier(m.product_id);
    return tier?.role === "recruiter";
  }).length;

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, check their subscription status
      const membershipPromises = (profilesData || []).map(async (profile) => {
        try {
          const { data: subData } = await supabase.functions.invoke("check-subscription", {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          });

          return {
            user_id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            product_id: subData?.product_id || null,
            subscribed: subData?.subscribed || false,
            subscription_end: subData?.subscription_end || null,
            created_at: profile.created_at,
          };
        } catch (error) {
          console.error(`Error fetching subscription for ${profile.email}:`, error);
          return {
            user_id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            product_id: null,
            subscribed: false,
            subscription_end: null,
            created_at: profile.created_at,
          };
        }
      });

      const membershipData = await Promise.all(membershipPromises);
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

  const getSortedAndFilteredMemberships = () => {
    let filtered = memberships.filter(
      (m) =>
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

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
    if (!membership.subscribed || !membership.product_id) {
      return <Badge variant="outline">Free</Badge>;
    }

    const tier = getMembershipTier(membership.product_id);
    if (!tier) return <Badge variant="outline">Unknown</Badge>;

    if (tier.role === "athlete") {
      if (tier.tier === "monthly") {
        return <Badge className="bg-primary">Pro Monthly</Badge>;
      } else if (tier.tier === "yearly") {
        return <Badge className="bg-secondary">Championship Yearly</Badge>;
      }
    } else if (tier.role === "recruiter") {
      if (tier.tier === "monthly") {
        return <Badge className="bg-purple-600">Recruiter Monthly</Badge>;
      } else if (tier.tier === "yearly") {
        return <Badge className="bg-purple-800">Recruiter Yearly</Badge>;
      }
    } else if (tier.role === "parent") {
      return <Badge variant="secondary">Parent</Badge>;
    }

    return <Badge variant="outline">Active</Badge>;
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
          <CardTitle>All Memberships</CardTitle>
          <CardDescription>View and sort all user memberships</CardDescription>
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-2"
                        onClick={() => handleSort("product_id")}
                      >
                        Plan
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMemberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
