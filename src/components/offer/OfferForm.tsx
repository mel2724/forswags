import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUpload } from "./DocumentUpload";

interface School {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
}

interface Document {
  name: string;
  url: string;
}

interface FormData {
  school_id: string;
  offer_date: string;
  offer_type: string;
  status: string;
  scholarship_amount: string;
  notes: string;
  negotiation_notes: string;
  response_deadline: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

interface OfferFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  schools: School[];
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  uploadingDocument: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  userId: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDocument: (index: number) => void;
}

export const OfferForm = ({
  formData,
  setFormData,
  schools,
  documents,
  setDocuments,
  uploadingDocument,
  onSubmit,
  onCancel,
  isEditing,
  userId,
  onFileUpload,
  onRemoveDocument,
}: OfferFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      <DocumentUpload
        documents={documents}
        uploadingDocument={uploadingDocument}
        onFileUpload={onFileUpload}
        onRemoveDocument={onRemoveDocument}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? "Update" : "Add"} Offer
        </Button>
      </div>
    </form>
  );
};
