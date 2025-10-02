import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, School } from "lucide-react";

interface School {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
  division: string | null;
}

interface Offer {
  id: string;
  school_id: string;
  offer_date: string;
  offer_type: string;
  status: string;
  scholarship_amount: number | null;
  response_deadline: string | null;
  contact_name: string | null;
  schools: School;
}

interface OfferComparisonProps {
  offers: Offer[];
}

const OfferComparison = ({ offers }: OfferComparisonProps) => {
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

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <School className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Add offers to see comparison</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Offer Comparison Matrix
        </CardTitle>
        <CardDescription>Compare all your offers side-by-side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">School</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Offer Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{offer.schools.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {offer.schools.location_city}, {offer.schools.location_state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{offer.schools.division || "N/A"}</TableCell>
                  <TableCell>{getOfferTypeLabel(offer.offer_type)}</TableCell>
                  <TableCell className="text-right">
                    {offer.scholarship_amount ? (
                      <span className="font-semibold text-primary">
                        ${offer.scholarship_amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(offer.response_deadline)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {offer.contact_name ? (
                      <span className="text-sm">{offer.contact_name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(offer.status)}>
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferComparison;
