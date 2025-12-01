import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { 
  ArrowLeft, BarChart3, Plus, Pencil, Trash2, TrendingUp,
  Calendar, Target, Award, Loader2, Download, Upload, Star,
  FileSpreadsheet, LineChart, Trophy
} from "lucide-react";

interface AthleteStat {
  id: string;
  stat_name: string;
  stat_value: number;
  season: string;
  category?: string;
  unit?: string;
  is_highlighted?: boolean;
  created_at: string;
}

const STAT_CATEGORIES = [
  { value: "offensive", label: "Offensive" },
  { value: "defensive", label: "Defensive" },
  { value: "physical", label: "Physical" },
  { value: "academic", label: "Academic" },
  { value: "leadership", label: "Leadership" },
];

const STAT_TEMPLATES = {
  football: [
    { name: "Touchdowns", category: "offensive", unit: "count" },
    { name: "Yards", category: "offensive", unit: "yards" },
    { name: "Tackles", category: "defensive", unit: "count" },
    { name: "Interceptions", category: "defensive", unit: "count" },
    { name: "40-Yard Dash", category: "physical", unit: "seconds" },
  ],
  basketball: [
    { name: "Points Per Game", category: "offensive", unit: "points" },
    { name: "Rebounds", category: "defensive", unit: "count" },
    { name: "Assists", category: "offensive", unit: "count" },
    { name: "Field Goal %", category: "offensive", unit: "percentage" },
    { name: "Steals", category: "defensive", unit: "count" },
  ],
  soccer: [
    { name: "Goals", category: "offensive", unit: "count" },
    { name: "Assists", category: "offensive", unit: "count" },
    { name: "Saves", category: "defensive", unit: "count" },
    { name: "Clean Sheets", category: "defensive", unit: "count" },
    { name: "Pass Completion %", category: "offensive", unit: "percentage" },
  ],
  baseball: [
    { name: "Batting Average", category: "offensive", unit: "average" },
    { name: "Home Runs", category: "offensive", unit: "count" },
    { name: "RBIs", category: "offensive", unit: "count" },
    { name: "ERA", category: "defensive", unit: "average" },
    { name: "Strikeouts", category: "defensive", unit: "count" },
  ],
};

const currentYear = new Date().getFullYear();
const seasons = [
  `${currentYear - 1}-${currentYear}`,
  `${currentYear}-${currentYear + 1}`,
  `${currentYear + 1}-${currentYear + 2}`,
  `${currentYear + 2}-${currentYear + 3}`,
];

const statSchema = z.object({
  stat_name: z.string().min(1, "Stat name is required").max(100),
  stat_value: z.number().min(0, "Value must be positive"),
  season: z.string().min(1, "Season is required"),
  category: z.string().optional(),
  unit: z.string().optional(),
  is_highlighted: z.boolean().optional(),
});

const StatsManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [stats, setStats] = useState<AthleteStat[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<AthleteStat | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "comparison">("grid");
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Form fields
  const [statName, setStatName] = useState("");
  const [statValue, setStatValue] = useState("");
  const [season, setSeason] = useState(seasons[0]);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Get athlete profile
        const { data: athlete } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (!athlete) {
          toast.error("This feature is only available for athlete profiles");
          navigate("/dashboard");
          return;
        }

        setAthleteId(athlete.id);

        // Fetch stats
        const { data: statsData, error } = await supabase
          .from("athlete_stats")
          .select("*")
          .eq("athlete_id", athlete.id)
          .order("season", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        setStats(statsData || []);
      } catch (error: any) {
        toast.error(error.message || "Error loading stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [navigate]);

  const resetForm = () => {
    setStatName("");
    setStatValue("");
    setSeason(seasons[0]);
    setCategory("");
    setUnit("");
    setIsHighlighted(false);
    setEditingStat(null);
  };

  const openEditDialog = (stat: AthleteStat) => {
    setEditingStat(stat);
    setStatName(stat.stat_name);
    setStatValue(stat.stat_value.toString());
    setSeason(stat.season);
    setCategory(stat.category || "");
    setUnit(stat.unit || "");
    setIsHighlighted(stat.is_highlighted || false);
    setIsDialogOpen(true);
  };

  const exportToCSV = () => {
    if (stats.length === 0) {
      toast.error("No stats to export");
      return;
    }

    const headers = ["Stat Name", "Value", "Unit", "Category", "Season", "Highlighted"];
    const rows = stats.map(s => [
      s.stat_name,
      s.stat_value,
      s.unit || "",
      s.category || "",
      s.season,
      s.is_highlighted ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Stats exported to CSV");
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !athleteId) return;

    // Validate file type (extension and MIME type)
    if (!file.name.endsWith('.csv') || file.type !== 'text/csv') {
      toast.error("Please upload a valid CSV file");
      event.target.value = '';
      return;
    }

    // Validate file size (max 500KB for CSV)
    const MAX_CSV_SIZE = 500 * 1024; // 500KB
    if (file.size > MAX_CSV_SIZE) {
      toast.error("CSV file must be less than 500KB");
      event.target.value = '';
      return;
    }

    // Rate limiting - max 1 import per minute
    const lastImportKey = `csv_import_${athleteId}`;
    const lastImport = localStorage.getItem(lastImportKey);
    const now = Date.now();
    if (lastImport && now - parseInt(lastImport) < 60000) {
      const secondsLeft = Math.ceil((60000 - (now - parseInt(lastImport))) / 1000);
      toast.error(`Please wait ${secondsLeft} seconds before importing again`);
      event.target.value = '';
      return;
    }
    localStorage.setItem(lastImportKey, now.toString());

    setSaving(true);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const text = await file.text();
      
      // Validate file signature (CSV should start with text characters)
      const firstBytes = text.substring(0, 100);
      if (!/^[\x20-\x7E\r\n\t]+$/.test(firstBytes)) {
        throw new Error("Invalid CSV file format - file appears to be corrupted or binary");
      }
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file is empty or has no data rows");
      }
      
      // Limit total rows to prevent abuse (max 100 rows)
      const MAX_ROWS = 100;
      if (lines.length - 1 > MAX_ROWS) {
        throw new Error(`CSV file exceeds maximum allowed rows (${MAX_ROWS}). Please split your data into smaller files.`);
      }

      // Parse header - support multiple CSV formats (ForSwags, Hudl, MaxPreps)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Detect CSV format
      const isHudlFormat = headers.some(h => h.includes('hudl') || h === 'game date');
      const isMaxPrepsFormat = headers.some(h => h.includes('maxpreps') || h === 'opponent');
      
      let indices: any = {};
      
      if (isHudlFormat) {
        // Hudl format: typically has columns like "Stat", "Value", "Game Date"
        indices = {
          name: headers.findIndex(h => h === 'stat' || h === 'statistic'),
          value: headers.findIndex(h => h === 'value' || h === 'total'),
          season: headers.findIndex(h => h === 'season' || h === 'year'),
          unit: -1,
          category: headers.findIndex(h => h === 'category' || h === 'type'),
          highlighted: -1,
        };
        
        // If no season column, use current season
        if (indices.season < 0) {
          indices.season = -1;
        }
      } else if (isMaxPrepsFormat) {
        // MaxPreps format: typically has columns like "Stat Name", "Total", "Avg"
        indices = {
          name: headers.findIndex(h => h === 'stat' || h === 'stat name' || h === 'statistic'),
          value: headers.findIndex(h => h === 'total' || h === 'value' || h === 'season total'),
          season: headers.findIndex(h => h === 'season' || h === 'year'),
          unit: -1,
          category: headers.findIndex(h => h === 'category'),
          highlighted: -1,
        };
        
        if (indices.season < 0) {
          indices.season = -1;
        }
      } else {
        // ForSwags format
        const requiredHeaders = ['stat name', 'value', 'season'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Expected: Stat Name, Value, Season`);
        }

        indices = {
          name: headers.indexOf('stat name'),
          value: headers.indexOf('value'),
          season: headers.indexOf('season'),
          unit: headers.indexOf('unit'),
          category: headers.indexOf('category'),
          highlighted: headers.indexOf('highlighted'),
        };
      }
      
      // Validate that we found the essential columns
      if (indices.name < 0 || indices.value < 0) {
        throw new Error("Could not identify stat name and value columns. Please ensure your CSV has 'Stat Name' and 'Value' columns.");
      }

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length < 3) {
            errors.push(`Row ${i + 1}: Incomplete data`);
            failedCount++;
            continue;
          }

          const statName = values[indices.name];
          const rawStatValue = values[indices.value];
          const season = indices.season >= 0 && values[indices.season] 
            ? values[indices.season] 
            : new Date().getFullYear().toString();
          const unit = indices.unit >= 0 ? values[indices.unit] : undefined;
          const category = indices.category >= 0 ? values[indices.category] : undefined;
          const isHighlighted = indices.highlighted >= 0 
            ? values[indices.highlighted].toLowerCase() === 'yes' || values[indices.highlighted] === '1'
            : false;

          // Sanitize inputs to prevent injection
          const sanitizedStatName = statName.replace(/[<>]/g, '').substring(0, 100);
          const sanitizedSeason = season.replace(/[<>]/g, '').substring(0, 20);
          const sanitizedUnit = unit?.replace(/[<>]/g, '').substring(0, 20);
          const sanitizedCategory = category?.replace(/[<>]/g, '').substring(0, 50);
          
          // Parse and validate stat value
          const statValue = parseFloat(rawStatValue);
          if (isNaN(statValue)) {
            errors.push(`Row ${i + 1}: Invalid numeric value`);
            failedCount++;
            continue;
          }

          // Validate data
          const validation = statSchema.safeParse({
            stat_name: sanitizedStatName,
            stat_value: statValue,
            season: sanitizedSeason,
            category: sanitizedCategory || undefined,
            unit: sanitizedUnit || undefined,
            is_highlighted: isHighlighted,
          });

          if (!validation.success) {
            errors.push(`Row ${i + 1}: ${validation.error.errors[0].message}`);
            failedCount++;
            continue;
          }

          // Verify ownership - ensure athleteId belongs to current user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Session expired. Please log in again.");
          }
          
          const { data: athlete } = await supabase
            .from("athletes")
            .select("id")
            .eq("id", athleteId)
            .eq("user_id", session.user.id)
            .single();
            
          if (!athlete) {
            throw new Error("Unauthorized: Cannot import stats for this athlete");
          }

          // Insert stat
          const { error } = await supabase
            .from("athlete_stats")
            .insert({
              athlete_id: athleteId,
              stat_name: validation.data.stat_name,
              stat_value: validation.data.stat_value,
              season: validation.data.season,
              category: validation.data.category,
              unit: validation.data.unit,
              is_highlighted: validation.data.is_highlighted,
            });

          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
          failedCount++;
        }
      }

      // Reload stats
      const { data: statsData } = await supabase
        .from("athlete_stats")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("season", { ascending: false })
        .order("created_at", { ascending: false });

      if (statsData) {
        setStats(statsData);
      }

      // Show results
      setImportResults({ success: successCount, failed: failedCount, errors });
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} stats`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} stats. Check details.`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error importing CSV");
      setImportResults({ success: 0, failed: 0, errors: [error.message] });
    } finally {
      setSaving(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const headers = ["Stat Name", "Value", "Unit", "Category", "Season", "Highlighted"];
    const sampleRows = [
      ["Touchdowns", "12", "count", "offensive", seasons[0], "Yes"],
      ["Tackles", "45", "count", "defensive", seasons[0], "No"],
      ["40-Yard Dash", "4.5", "seconds", "physical", seasons[0], "Yes"],
    ];

    const csv = [headers, ...sampleRows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats-sample.csv";
    a.click();
    toast.success("Sample CSV downloaded");
  };

  const handleTemplateSelect = (sport: keyof typeof STAT_TEMPLATES) => {
    setIsTemplateDialogOpen(false);
    const templates = STAT_TEMPLATES[sport];
    toast.success(`Added ${templates.length} stat templates. Fill in values for ${season}.`);
    
    templates.forEach(template => {
      setStatName(template.name);
      setCategory(template.category);
      setUnit(template.unit);
      setIsDialogOpen(true);
    });
  };

  const handleSave = async () => {
    if (!athleteId) return;
    setSaving(true);

    try {
      const data = statSchema.parse({
        stat_name: statName.trim(),
        stat_value: parseFloat(statValue),
        season: season,
        category: category || null,
        unit: unit || null,
        is_highlighted: isHighlighted,
      });

      if (editingStat) {
        // Update existing stat
        const { error } = await supabase
          .from("athlete_stats")
          .update({
            stat_name: data.stat_name,
            stat_value: data.stat_value,
            season: data.season,
            category: data.category,
            unit: data.unit,
            is_highlighted: data.is_highlighted,
          })
          .eq("id", editingStat.id);

        if (error) throw error;

        setStats(stats.map(s => 
          s.id === editingStat.id 
            ? { ...s, ...data }
            : s
        ));

        toast.success("Stat updated successfully!");
      } else {
        // Create new stat
        const { data: newStat, error } = await supabase
          .from("athlete_stats")
          .insert({
            athlete_id: athleteId,
            stat_name: data.stat_name,
            stat_value: data.stat_value,
            season: data.season,
            category: data.category,
            unit: data.unit,
            is_highlighted: data.is_highlighted,
          })
          .select()
          .single();

        if (error) throw error;

        setStats([newStat, ...stats]);
        toast.success("Stat added successfully!");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error saving stat");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (statId: string) => {
    if (!confirm("Are you sure you want to delete this stat?")) return;

    try {
      const { error } = await supabase
        .from("athlete_stats")
        .delete()
        .eq("id", statId);

      if (error) throw error;

      setStats(stats.filter(s => s.id !== statId));
      toast.success("Stat deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error deleting stat");
    }
  };

  const groupedStats = stats.reduce((acc, stat) => {
    if (!acc[stat.season]) {
      acc[stat.season] = [];
    }
    acc[stat.season].push(stat);
    return acc;
  }, {} as Record<string, AthleteStat[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background sports-pattern flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-gradient-primary">Stats Manager</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Track Your Performance</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase mb-2 text-gradient-accent">
              Performance Statistics
            </h2>
            <p className="text-muted-foreground">
              Track your athletic performance across seasons
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Templates
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stat
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="uppercase tracking-tight">
                  {editingStat ? "Edit Stat" : "Add New Stat"}
                </DialogTitle>
                <DialogDescription>
                  {editingStat 
                    ? "Update your performance statistic" 
                    : "Add a new performance statistic to your profile"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="statName">Stat Name *</Label>
                  <Input
                    id="statName"
                    value={statName}
                    onChange={(e) => setStatName(e.target.value)}
                    placeholder="e.g., Touchdowns, Points, Goals"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statValue">Value *</Label>
                  <Input
                    id="statValue"
                    type="number"
                    step="0.01"
                    value={statValue}
                    onChange={(e) => setStatValue(e.target.value)}
                    placeholder="e.g., 12, 45.5, 3.8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g., yards, seconds"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">Season *</Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="highlight" className="text-sm font-medium">
                      Highlight Stat
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show this stat prominently on your profile
                    </p>
                  </div>
                  <Switch
                    id="highlight"
                    checked={isHighlighted}
                    onCheckedChange={setIsHighlighted}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStat ? "Update" : "Add"} Stat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sport Templates Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Sport Templates</DialogTitle>
                <DialogDescription>
                  Quick-start with common stats for your sport
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                {Object.keys(STAT_TEMPLATES).map((sport) => (
                  <Button
                    key={sport}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handleTemplateSelect(sport as keyof typeof STAT_TEMPLATES)}
                  >
                    <div className="text-left">
                      <div className="font-semibold capitalize">{sport}</div>
                      <div className="text-xs text-muted-foreground">
                        {STAT_TEMPLATES[sport as keyof typeof STAT_TEMPLATES].length} common stats
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* CSV Import Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) setImportResults(null);
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-tight">
                  Bulk Import Stats
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import multiple stats at once
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!importResults ? (
                  <>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <Label 
                        htmlFor="csv-upload" 
                        className="cursor-pointer text-primary hover:underline font-semibold"
                      >
                        Click to upload CSV file
                      </Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        disabled={saving}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Max file size: 1MB | Max rows: 100
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">CSV Format Requirements</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={downloadSampleCSV}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download Sample
                        </Button>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                        <p className="font-semibold">Required Columns:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li><code className="bg-background px-1 py-0.5 rounded">Stat Name</code> - Name of the statistic</li>
                          <li><code className="bg-background px-1 py-0.5 rounded">Value</code> - Numeric value</li>
                          <li><code className="bg-background px-1 py-0.5 rounded">Season</code> - Format: YYYY-YYYY (e.g., 2024-2025)</li>
                        </ul>
                        
                        <p className="font-semibold mt-3">Optional Columns:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li><code className="bg-background px-1 py-0.5 rounded">Unit</code> - yards, seconds, points, etc.</li>
                          <li><code className="bg-background px-1 py-0.5 rounded">Category</code> - offensive, defensive, physical, academic, leadership</li>
                          <li><code className="bg-background px-1 py-0.5 rounded">Highlighted</code> - Yes/No or 1/0</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6 p-6 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-black text-green-600">
                          {importResults.success}
                        </div>
                        <div className="text-sm text-muted-foreground">Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-destructive">
                          {importResults.failed}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-destructive">
                          Errors ({importResults.errors.length}):
                        </p>
                        <div className="max-h-48 overflow-y-auto bg-destructive/10 p-3 rounded-lg space-y-1">
                          {importResults.errors.map((error, idx) => (
                            <p key={idx} className="text-xs text-destructive">
                              {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        setImportResults(null);
                        setIsImportDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>

              {!importResults && (
                <DialogFooter>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setImportResults(null);
                    }}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {stats.length === 0 ? (
          <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
            <BarChart3 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-black uppercase mb-4 text-gradient-primary">No Stats Yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start tracking your performance by adding your first statistic. Showcase your achievements to college recruiters!
            </p>
            <Button 
              className="btn-accent" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Stat
            </Button>
          </Card>
        ) : (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="grid">
                <BarChart3 className="h-4 w-4 mr-2" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <LineChart className="h-4 w-4 mr-2" />
                Season Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-8">
              {Object.entries(groupedStats).map(([seasonName, seasonStats]) => (
              <Card key={seasonName} className="border-2 border-primary/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-card to-card/50 border-b-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-2xl font-black uppercase">
                          Season {seasonName}
                        </CardTitle>
                        <CardDescription>
                          {seasonStats.length} {seasonStats.length === 1 ? "stat" : "stats"} recorded
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary">
                      {seasonStats.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seasonStats.map((stat) => (
                      <div 
                        key={stat.id} 
                        className={`p-4 rounded-lg border-2 transition-all duration-200 bg-card/50 backdrop-blur relative ${
                          stat.is_highlighted 
                            ? 'border-primary shadow-lg shadow-primary/20' 
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {stat.is_highlighted && (
                          <Star className="absolute top-2 right-2 h-4 w-4 text-primary fill-primary" />
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                                {stat.stat_name}
                              </h4>
                              {stat.category && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {stat.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-black text-gradient-primary">
                                {stat.stat_value % 1 === 0 
                                  ? stat.stat_value 
                                  : stat.stat_value.toFixed(2)}
                              </span>
                              {stat.unit && (
                                <span className="text-sm text-muted-foreground">
                                  {stat.unit}
                                </span>
                              )}
                              <TrendingUp className="h-4 w-4 text-secondary" />
                            </div>
                          </div>
                          <Target className="h-8 w-8 text-primary/30" />
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditDialog(stat)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(stat.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Season-by-Season Comparison
                  </CardTitle>
                  <CardDescription>
                    Track your progress across multiple seasons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const statNameMap = new Map<string, Map<string, number>>();
                    stats.forEach(stat => {
                      if (!statNameMap.has(stat.stat_name)) {
                        statNameMap.set(stat.stat_name, new Map());
                      }
                      statNameMap.get(stat.stat_name)!.set(stat.season, stat.stat_value);
                    });

                    return Array.from(statNameMap.entries()).length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Add stats for multiple seasons to see comparisons
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {Array.from(statNameMap.entries()).map(([statName, seasonValues]) => {
                          if (seasonValues.size < 2) return null;
                          
                          const sortedSeasons = Array.from(seasonValues.entries()).sort();
                          const maxValue = Math.max(...Array.from(seasonValues.values()));
                          
                          return (
                            <div key={statName} className="space-y-3 p-4 border rounded-lg">
                              <h4 className="font-bold uppercase text-sm">{statName}</h4>
                              <div className="space-y-2">
                                {sortedSeasons.map(([season, value]) => {
                                  const percentage = (value / maxValue) * 100;
                                  return (
                                    <div key={season} className="flex items-center gap-3">
                                      <span className="text-xs text-muted-foreground w-24">
                                        {season}
                                      </span>
                                      <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                                        <div 
                                          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold w-16 text-right">
                                        {value % 1 === 0 ? value : value.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default StatsManager;
