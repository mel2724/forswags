import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School, Calendar, DollarSign, User, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

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

interface OfferCardProps {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (offerId: string) => void;
}

export const OfferCard = ({ offer, onEdit, onDelete }: OfferCardProps) => {
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

  return (
    <Card>
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
            <Button variant="ghost" size="icon" onClick={() => onEdit(offer)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(offer.id)}>
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
  );
};
