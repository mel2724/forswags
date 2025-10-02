import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, School, Calendar, DollarSign, User, Phone, Mail, Edit, Trash2, FileText, Upload, X } from "lucide-react";
import { format } from "date-fns";
import OfferComparison from "@/components/OfferComparison";
import DecisionTimeline from "@/components/DecisionTimeline";

interface School {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
  division: string | null;
}

interface Offer {
  id: string;
  athlete_id: string;
  school_id: string;
  offer_date: string;
  offer_type: string;
  status: string;
  scholarship_amount: number | null;
  notes: string | null;
  negotiation_notes: string | null;
  response_deadline: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  documents: Array<{ name: string; url: string }>;
  schools: School;
}

interface Document {
  name: string;
  url: string;
}

const OfferTracker = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [athleteId, setAthleteId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [signingDayDate, setSigningDayDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [formData, setFormData] = useState({
    school_id: "",
    offer_date: new Date().toISOString().split("T")[0],
    offer_type: "partial_scholarship",
    status: "pending",
    scholarship_amount: "",
    notes: "",
    negotiation_notes: "",
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

      setUserId(user.id);

      const { data: athlete } = await supabase
        .from("athletes")
        .select("id, signing_day_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!athlete) {
        toast.error("Profile Required", { description: "Please complete your athlete profile first." });
        navigate("/profile");
        return;
      }

      setAthleteId(athlete.id);
      setSigningDayDate(athlete.signing_day_date);

      const { data: offersData, error: offersError } = await supabase
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
        .eq("athlete_id", athlete.id)
        .order("offer_date", { ascending: false });

      if (offersError) throw offersError;
      
      const formattedOffers = (offersData || []).map(offer => ({
        ...offer,
        documents: (offer.documents as any as Document[]) || []
      })) as Offer[];
      
      setOffers(formattedOffers);

      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, name, location_city, location_state, division")
        .order("name");

      setSchools(schoolsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('offer-documents')
        .getPublicUrl(fileName);

      setDocuments([...documents, { name: file.name, url: fileName }]);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const offerData = {
        athlete_id: athleteId,
        school_id: formData.school_id,
        offer_date: formData.offer_date,
        offer_type: formData.offer_type,
        status: formData.status,
        scholarship_amount: formData.scholarship_amount ? parseFloat(formData.scholarship_amount) : null,
        notes: formData.notes || null,
        negotiation_notes: formData.negotiation_notes || null,
        response_deadline: formData.response_deadline || null,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        documents: JSON.parse(JSON.stringify(documents)),
      };

      if (editingOffer) {
        const { error } = await supabase
          .from("college_offers")
          .update(offerData)
          .eq("id", editingOffer.id);

        if (error) throw error;
        toast.success("Offer updated successfully");
      } else {
        const { error } = await supabase
          .from("college_offers")
          .insert([offerData]);

        if (error) throw error;
        toast.success("Offer added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error("Failed to save offer");
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const { error } = await supabase
        .from("college_offers")
        .delete()
        .eq("id", offerId);

      if (error) throw error;

      toast.success("Offer deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      school_id: offer.school_id,
      offer_date: offer.offer_date,
      offer_type: offer.offer_type,
      status: offer.status,
      scholarship_amount: offer.scholarship_amount?.toString() || "",
      notes: offer.notes || "",
      negotiation_notes: offer.negotiation_notes || "",
      response_deadline: offer.response_deadline || "",
      contact_name: offer.contact_name || "",
      contact_email: offer.contact_email || "",
      contact_phone: offer.contact_phone || "",
    });
    setDocuments(offer.documents || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      school_id: "",
      offer_date: new Date().toISOString().split("T")[0],
      offer_type: "partial_scholarship",
      status: "pending",
      scholarship_amount: "",
      notes: "",
      negotiation_notes: "",
      response_deadline: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
    });
    setDocuments([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500";
      case "declined":
        return "bg-red-500";
      case "expired":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getOfferTypeLabel = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">College Offer Tracker</h1>
              <p className="text-muted-foreground">Manage and track your recruitment offers</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
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
                <DialogTitle>{editingOffer ? "Edit" : "Add"} College Offer</DialogTitle>
                <DialogDescription>
                  {editingOffer ? "Update" : "Enter"} the details of your college offer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>School *</Label>
                  <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offer Date *</Label>
                    <Input
                      type="date"
                      value={formData.offer_date}
                      onChange={(e) => setFormData({ ...formData, offer_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Response Deadline</Label>
                    <Input
                      type="date"
                      value={formData.response_deadline}
                      onChange={(e) => setFormData({ ...formData, response_deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offer Type *</Label>
                    <Select value={formData.offer_type} onValueChange={(value) => setFormData({ ...formData, offer_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_scholarship">Full Scholarship</SelectItem>
                        <SelectItem value="partial_scholarship">Partial Scholarship</SelectItem>
                        <SelectItem value="walk_on">Walk On</SelectItem>
                        <SelectItem value="preferred_walk_on">Preferred Walk On</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                </div>

                <div className="space-y-2">
                  <Label>Scholarship Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.scholarship_amount}
                    onChange={(e) => setFormData({ ...formData, scholarship_amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="Coach's name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      placeholder="coach@university.edu"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional details about the offer..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Negotiation Notes</Label>
                  <Textarea
                    placeholder="Track negotiation discussions, counteroffers, and strategies..."
                    value={formData.negotiation_notes}
                    onChange={(e) => setFormData({ ...formData, negotiation_notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Documents</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingDocument}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={uploadingDocument}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    {documents.length > 0 && (
                      <div className="space-y-1">
                        {documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded border bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{doc.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDocument(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingOffer ? "Update" : "Add"} Offer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <School className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Offers Yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking your college recruitment offers</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Offer
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Card View</TabsTrigger>
            <TabsTrigger value="comparison">Comparison Matrix</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            <div className="grid gap-4">
              {offers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <School className="h-5 w-5" />
                        {offer.schools.name}
                      </CardTitle>
                      <CardDescription>
                        {offer.schools.location_city}, {offer.schools.location_state} • {offer.schools.division}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(offer.status)}>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(offer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Offer Date</p>
                        <p className="text-sm font-medium">{format(new Date(offer.offer_date), "MMM d, yyyy")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm font-medium">{getOfferTypeLabel(offer.offer_type)}</p>
                      </div>
                    </div>

                    {offer.scholarship_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-sm font-medium">${offer.scholarship_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {offer.response_deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Deadline</p>
                          <p className="text-sm font-medium">{format(new Date(offer.response_deadline), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(offer.contact_name || offer.contact_email || offer.contact_phone) && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Contact Information</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        {offer.contact_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {offer.contact_name}
                          </div>
                        )}
                        {offer.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {offer.contact_email}
                          </div>
                        )}
                        {offer.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {offer.contact_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {offer.notes && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <p className="text-sm text-muted-foreground">{offer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <OfferComparison offers={offers} />
          </TabsContent>

          <TabsContent value="timeline">
            <DecisionTimeline offers={offers} signingDayDate={signingDayDate} />
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};

export default OfferTracker;