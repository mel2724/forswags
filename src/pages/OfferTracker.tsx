import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, School, Calendar } from "lucide-react";
import OfferComparison from "@/components/OfferComparison";
import DecisionTimeline from "@/components/DecisionTimeline";
import { OfferForm } from "@/components/offer/OfferForm";
import { OfferCard } from "@/components/offer/OfferCard";
import { z } from "zod";

const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const offerSchema = z.object({
  school_id: z.string().min(1, "School is required"),
  offer_type: z.string().min(1, "Offer type is required"),
  scholarship_amount: z.number().min(0, "Amount must be positive").optional().nullable(),
  offer_date: z.string().min(1, "Offer date is required"),
  response_deadline: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required"),
  contact_name: z.string().trim().max(100, "Name too long").optional().or(z.literal('')),
  contact_email: z.string().trim().email("Invalid email").max(255, "Email too long").optional().or(z.literal('')),
  contact_phone: z.string().trim().max(20, "Phone too long").optional().or(z.literal('')),
  notes: z.string().trim().max(2000, "Notes too long").optional().or(z.literal('')),
  negotiation_notes: z.string().trim().max(2000, "Notes too long").optional().or(z.literal('')),
});

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
  const [signingDayDialogOpen, setSigningDayDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tempSigningDay, setTempSigningDay] = useState("");

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

    // Validate file type
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, JPEG, or PNG files only.");
      return;
    }

    // Validate file size
    if (file.size > MAX_DOCUMENT_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploadingDocument(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

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
      // Validate form data
      const validation = offerSchema.safeParse({
        school_id: formData.school_id,
        offer_type: formData.offer_type,
        scholarship_amount: formData.scholarship_amount ? parseFloat(formData.scholarship_amount) : null,
        offer_date: formData.offer_date,
        response_deadline: formData.response_deadline || null,
        status: formData.status,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        notes: formData.notes,
        negotiation_notes: formData.negotiation_notes,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      // Verify athlete ownership
      const { data: athlete } = await supabase
        .from("athletes")
        .select("user_id")
        .eq("id", athleteId)
        .single();

      if (!athlete || athlete.user_id !== userId) {
        toast.error("Unauthorized: You can only manage your own offers");
        return;
      }
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

  const handleSetSigningDay = async () => {
    if (!tempSigningDay) {
      toast.error("Please select a date");
      return;
    }

    try {
      const { error } = await supabase
        .from("athletes")
        .update({ signing_day_date: tempSigningDay })
        .eq("id", athleteId);

      if (error) throw error;

      setSigningDayDate(tempSigningDay);
      setSigningDayDialogOpen(false);
      toast.success("Signing day date updated");
    } catch (error) {
      console.error("Error updating signing day:", error);
      toast.error("Failed to update signing day");
    }
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

          <div className="flex items-center gap-2">
            {!signingDayDate && (
              <Dialog open={signingDayDialogOpen} onOpenChange={setSigningDayDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Signing Day
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set National Signing Day</DialogTitle>
                    <DialogDescription>
                      Enter your target signing day date to track your timeline
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Signing Day Date</Label>
                      <Input
                        type="date"
                        value={tempSigningDay}
                        onChange={(e) => setTempSigningDay(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSigningDayDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSetSigningDay}>
                        Set Date
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

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
              <OfferForm
                formData={formData}
                setFormData={setFormData}
                schools={schools}
                documents={documents}
                setDocuments={setDocuments}
                uploadingDocument={uploadingDocument}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                isEditing={!!editingOffer}
                userId={userId}
                onFileUpload={handleFileUpload}
                onRemoveDocument={handleRemoveDocument}
              />
            </DialogContent>
          </Dialog>
          </div>
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
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                />
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