import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trophy, DollarSign, Calendar, School, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface School {
  id: string;
  name: string;
  location_city: string;
  location_state: string;
  division: string;
}

interface Offer {
  id: string;
  school_id: string;
  offer_date: string;
  offer_type: string;
  status: string;
  scholarship_amount: number | null;
  notes: string | null;
  response_deadline: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  schools: School;
}

export default function OfferTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [formData, setFormData] = useState({
    school_id: "",
    offer_date: new Date().toISOString().split('T')[0],
    offer_type: "full_scholarship",
    status: "pending",
    scholarship_amount: "",
    notes: "",
    response_deadline: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (athleteData) {
        setAthleteId(athleteData.id);
        fetchOffers(athleteData.id);
      }

      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, name, location_city, location_state, division")
        .order("name");

      setSchools(schoolsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async (athleteId: string) => {
    const { data } = await supabase
      .from("college_offers")
      .select(`
        *,
        schools (
          id,
          name,
          location_city,
          location_state,
          division
        )
      `)
      .eq("athlete_id", athleteId)
      .order("offer_date", { ascending: false });

    setOffers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteId) return;

    const offerData = {
      athlete_id: athleteId,
      school_id: formData.school_id,
      offer_date: formData.offer_date,
      offer_type: formData.offer_type,
      status: formData.status,
      scholarship_amount: formData.scholarship_amount ? parseFloat(formData.scholarship_amount) : null,
      notes: formData.notes || null,
      response_deadline: formData.response_deadline || null,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
    };

    try {
      if (editingOffer) {
        const { error } = await supabase
          .from("college_offers")
          .update(offerData)
          .eq("id", editingOffer.id);

        if (error) throw error;
        toast({ title: "Success", description: "Offer updated successfully" });
      } else {
        const { error } = await supabase
          .from("college_offers")
          .insert(offerData);

        if (error) throw error;
        toast({ title: "Success", description: "Offer added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOffers(athleteId);
    } catch (error) {
      console.error("Error saving offer:", error);
      toast({
        title: "Error",
        description: "Failed to save offer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("college_offers")
        .delete()
        .eq("id", offerId);

      if (error) throw error;

      toast({ title: "Success", description: "Offer deleted successfully" });
      if (athleteId) fetchOffers(athleteId);
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      school_id: offer.school_id,
      offer_date: offer.offer_date,
      offer_type: offer.offer_type,
      status: offer.status,
      scholarship_amount: offer.scholarship_amount?.toString() || "",
      notes: offer.notes || "",
      response_deadline: offer.response_deadline || "",
      contact_name: offer.contact_name || "",
      contact_email: offer.contact_email || "",
      contact_phone: offer.contact_phone || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      school_id: "",
      offer_date: new Date().toISOString().split('T')[0],
      offer_type: "full_scholarship",
      status: "pending",
      scholarship_amount: "",
      notes: "",
      response_deadline: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      declined: "destructive",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getOfferTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full_scholarship: "Full Scholarship",
      partial_scholarship: "Partial Scholarship",
      walk_on: "Walk-On",
      preferred_walk_on: "Preferred Walk-On",
    };
    return labels[type] || type;
  };

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    totalValue: offers.reduce((sum, o) => sum + (o.scholarship_amount || 0), 0),
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">College Offer Tracker</h1>
              <p className="text-sm text-muted-foreground">Manage your recruitment offers</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
                <DialogDescription>Enter the details of your college offer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="school_id">School *</Label>
                    <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name} - {school.location_city}, {school.location_state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="offer_type">Offer Type *</Label>
                    <Select value={formData.offer_type} onValueChange={(value) => setFormData({ ...formData, offer_type: value })} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_scholarship">Full Scholarship</SelectItem>
                        <SelectItem value="partial_scholarship">Partial Scholarship</SelectItem>
                        <SelectItem value="walk_on">Walk-On</SelectItem>
                        <SelectItem value="preferred_walk_on">Preferred Walk-On</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="offer_date">Offer Date *</Label>
                    <Input
                      type="date"
                      value={formData.offer_date}
                      onChange={(e) => setFormData({ ...formData, offer_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="response_deadline">Response Deadline</Label>
                    <Input
                      type="date"
                      value={formData.response_deadline}
                      onChange={(e) => setFormData({ ...formData, response_deadline: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="scholarship_amount">Scholarship Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.scholarship_amount}
                      onChange={(e) => setFormData({ ...formData, scholarship_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Coach name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="coach@school.edu"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional details about the offer..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingOffer ? "Update" : "Add"} Offer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Offers</CardTitle>
            <CardDescription>Track and manage all your college recruitment offers</CardDescription>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No offers yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your college offers by adding your first one</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Offer
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Offer Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{offer.schools.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {offer.schools.location_city}, {offer.schools.location_state} • {offer.schools.division}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getOfferTypeLabel(offer.offer_type)}</TableCell>
                        <TableCell>{getStatusBadge(offer.status)}</TableCell>
                        <TableCell>
                          {offer.scholarship_amount ? `$${offer.scholarship_amount.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>{format(new Date(offer.offer_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {offer.response_deadline ? format(new Date(offer.response_deadline), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {offer.contact_name ? (
                            <div className="text-sm">
                              <div>{offer.contact_name}</div>
                              {offer.contact_email && (
                                <div className="text-muted-foreground">{offer.contact_email}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(offer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(offer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
