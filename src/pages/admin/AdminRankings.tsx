import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Trash2, Download, Lock, Unlock, Loader2, Trophy } from "lucide-react";

interface RankingEntry {
  id: string;
  athlete_id: string | null;
  external_athlete_name?: string | null;
  is_external_only?: boolean;
  overall_rank: number | null;
  position_rank: number | null;
  state_rank: number | null;
  national_rank: number | null;
  composite_score: number | null;
  last_calculated: string;
  is_manual_override?: boolean;
  sport?: string;
  graduation_year?: number | null;
  athletes?: {
    sport: string;
    position: string | null;
    user_id: string;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
}

export default function AdminRankings() {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [newRanking, setNewRanking] = useState({
    athlete_id: "",
    overall_rank: "",
    position_rank: "",
    state_rank: "",
    national_rank: "",
    composite_score: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load rankings with athlete data
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*, athletes(sport, position, user_id)")
        .order("overall_rank", { ascending: true, nullsFirst: false });

      if (rankingsError) throw rankingsError;

      // Get profiles (only for internal athletes)
      const userIds = rankingsData?.map(r => r.athletes?.user_id).filter(Boolean) || [];
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profilesData = data || [];
      }

      const rankingsWithProfiles = rankingsData?.map(ranking => ({
        ...ranking,
        profiles: ranking.athletes?.user_id 
          ? profilesData?.find(p => p.id === ranking.athletes?.user_id) || null
          : null
      })) || [];

      setRankings(rankingsWithProfiles);

      // Load all athletes for dropdown
      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("id, sport, position, user_id");

      if (athletesError) throw athletesError;

      // Get athlete profiles
      const athleteUserIds = athletesData?.map(a => a.user_id) || [];
      const { data: athleteProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", athleteUserIds);

      const athletesWithProfiles = athletesData?.map(athlete => ({
        ...athlete,
        full_name: athleteProfiles?.find(p => p.id === athlete.user_id)?.full_name || "Unknown"
      })) || [];

      setAthletes(athletesWithProfiles);
    } catch (error: any) {
      console.error("Error loading rankings:", error);
      toast({
        title: "Error",
        description: "Failed to load rankings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRanking = async () => {
    try {
      if (!newRanking.athlete_id) {
        toast({
          title: "Error",
          description: "Please select an athlete",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("rankings")
        .insert({
          athlete_id: newRanking.athlete_id,
          overall_rank: newRanking.overall_rank ? parseInt(newRanking.overall_rank) : null,
          position_rank: newRanking.position_rank ? parseInt(newRanking.position_rank) : null,
          state_rank: newRanking.state_rank ? parseInt(newRanking.state_rank) : null,
          national_rank: newRanking.national_rank ? parseInt(newRanking.national_rank) : null,
          composite_score: newRanking.composite_score ? parseFloat(newRanking.composite_score) : null,
          last_calculated: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ranking added successfully",
      });

      setAddDialogOpen(false);
      setNewRanking({
        athlete_id: "",
        overall_rank: "",
        position_rank: "",
        state_rank: "",
        national_rank: "",
        composite_score: ""
      });
      loadData();
    } catch (error: any) {
      console.error("Error adding ranking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add ranking",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRanking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ranking?")) return;

    try {
      const { error } = await supabase
        .from("rankings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ranking deleted successfully",
      });
      loadData();
    } catch (error: any) {
      console.error("Error deleting ranking:", error);
      toast({
        title: "Error",
        description: "Failed to delete ranking",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateRankings = async () => {
    setCalculating(true);
    try {
      const { error } = await supabase.functions.invoke("recalculate-rankings");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rankings recalculated successfully",
      });
      loadData();
    } catch (error: any) {
      console.error("Error recalculating rankings:", error);
      toast({
        title: "Error",
        description: "Failed to recalculate rankings",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Rankings Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage athlete rankings and recalculate scores from evaluations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              setLoading(true);
              try {
                console.log('Fetching ESPN rankings...');
                const { data: espnData, error: espnError } = await supabase.functions.invoke('fetch-espn-rankings', {
                  body: { 
                    sport: 'football',
                    year: new Date().getFullYear()
                  }
                });

                if (espnError) {
                  console.error('ESPN API error:', espnError);
                  toast({
                    title: "Import Failed",
                    description: espnError.message,
                    variant: "destructive",
                  });
                } else if (espnData && espnData.athletes_imported > 0) {
                  toast({
                    title: "Import Successful",
                    description: `Imported ${espnData.athletes_imported} rankings from ESPN`,
                  });
                  loadData();
                } else {
                  toast({
                    title: "Import Completed",
                    description: "No data retrieved from ESPN",
                    variant: "destructive",
                  });
                }
              } catch (error: any) {
                toast({
                  title: "Import Failed",
                  description: error.message,
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || calculating}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Import Top 100
          </Button>
          <Button 
            onClick={async () => {
              setCalculating(true);
              try {
                const { data, error } = await supabase.functions.invoke('merge-rankings', {
                  body: { sport: 'football', preserveOverrides: true }
                });
                if (error) throw error;
                toast({
                  title: "Merge Complete",
                  description: `Updated ${data.rankings_updated} rankings (preserved ${data.preserved_overrides} manual overrides)`,
                });
                loadData();
              } catch (error: any) {
                toast({
                  title: "Merge Failed",
                  description: error.message,
                  variant: "destructive",
                });
              } finally {
                setCalculating(false);
              }
            }}
            disabled={loading || calculating}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Merge & Calculate
          </Button>
          <Button onClick={handleRecalculateRankings} disabled={calculating} variant="outline">
            {calculating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalculate Internal
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Ranking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Ranking</DialogTitle>
                <DialogDescription>
                  Manually add a ranking entry for an athlete (placeholder rankings)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Athlete</Label>
                  <Select
                    value={newRanking.athlete_id}
                    onValueChange={(value) => setNewRanking({ ...newRanking, athlete_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.full_name} - {athlete.sport} ({athlete.position || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Overall Rank</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      value={newRanking.overall_rank}
                      onChange={(e) => setNewRanking({ ...newRanking, overall_rank: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Position Rank</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      value={newRanking.position_rank}
                      onChange={(e) => setNewRanking({ ...newRanking, position_rank: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State Rank</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      value={newRanking.state_rank}
                      onChange={(e) => setNewRanking({ ...newRanking, state_rank: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>National Rank</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      value={newRanking.national_rank}
                      onChange={(e) => setNewRanking({ ...newRanking, national_rank: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Composite Score</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 95.5"
                    value={newRanking.composite_score}
                    onChange={(e) => setNewRanking({ ...newRanking, composite_score: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Score range: 0-100 (will be replaced by evaluation scores)
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddRanking} className="flex-1">
                    Add Ranking
                  </Button>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">ESPN Rankings Import</h3>
              <p className="text-sm text-muted-foreground mb-3">
                The "Import Top 100" button fetches the latest athlete rankings from ESPN's API:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="default" className="mt-0.5">ESPN API</Badge>
                  <span className="text-muted-foreground">Free hidden API providing current recruiting rankings (no key required)</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                All operations are logged in <a href="/admin/scraping-history" className="underline">Scraping History</a> with detailed error tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Rankings ({rankings.length})</CardTitle>
          <CardDescription>
            Placeholder rankings will be replaced as athletes complete evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Athlete</TableHead>
                <TableHead>Sport / Position</TableHead>
                <TableHead className="text-center">Overall</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-center">State</TableHead>
                <TableHead className="text-center">National</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No rankings yet. Add placeholder rankings to get started.
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {ranking.is_external_only ? (
                          <>
                            <span>{ranking.external_athlete_name || "Unknown"}</span>
                            <Badge variant="outline" className="text-xs">External</Badge>
                          </>
                        ) : (
                          <span>{ranking.profiles?.full_name || "Unknown"}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{ranking.sport || ranking.athletes?.sport || "N/A"}</div>
                        <div className="text-muted-foreground text-xs">
                          {ranking.athletes?.position || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ranking.overall_rank ? (
                          <Badge variant="outline">#{ranking.overall_rank}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {ranking.is_manual_override && (
                          <Lock className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {ranking.position_rank ? (
                        <Badge variant="outline">#{ranking.position_rank}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {ranking.state_rank ? (
                        <Badge variant="outline">#{ranking.state_rank}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {ranking.national_rank ? (
                        <Badge variant="outline">#{ranking.national_rank}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {ranking.composite_score ? ranking.composite_score.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(ranking.last_calculated).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              const { error } = await supabase
                                .from('rankings')
                                .update({ 
                                  is_manual_override: !ranking.is_manual_override,
                                  overridden_at: new Date().toISOString(),
                                  overridden_by: user?.id
                                })
                                .eq('id', ranking.id);
                              
                              if (!error) {
                                toast({
                                  title: ranking.is_manual_override ? "Unlocked" : "Locked",
                                  description: ranking.is_manual_override 
                                    ? "Ranking will be recalculated on next merge"
                                    : "Ranking is now locked from automatic updates"
                                });
                                loadData();
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to toggle lock status",
                                variant: "destructive",
                              });
                            }
                          }}
                          title={ranking.is_manual_override ? "Unlock ranking" : "Lock ranking"}
                        >
                          {ranking.is_manual_override ? (
                            <Unlock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRanking(ranking.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Rankings Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Placeholder Rankings:</strong> Add initial rankings manually for top 100 athletes to populate the rankings page.
          </p>
          <p>
            <strong>Automatic Updates:</strong> When ForSWAGs athletes complete evaluations, their scores automatically calculate and update rankings.
          </p>
          <p>
            <strong>Composite Score:</strong> Calculated from evaluation scores (technical skills, game knowledge, athleticism, mental game) and course completions.
          </p>
          <p>
            <strong>Recalculation:</strong> Click "Recalculate All" to update all rankings based on latest evaluation data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
