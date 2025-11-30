import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

interface School {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
}

interface Offer {
  id: string;
  school_id: string;
  response_deadline: string | null;
  status: string;
  schools: School;
}

interface DecisionTimelineProps {
  offers: Offer[];
  signingDayDate?: string | null;
}

const DecisionTimeline = ({ offers, signingDayDate }: DecisionTimelineProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getDaysRemaining = (deadline: string) => {
    return differenceInDays(new Date(deadline), currentTime);
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return "bg-gray-500";
    if (daysRemaining <= 7) return "bg-red-500";
    if (daysRemaining <= 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  const pendingOffers = offers
    .filter(o => o.status === "pending" && o.response_deadline)
    .sort((a, b) => {
      const dateA = new Date(a.response_deadline!);
      const dateB = new Date(b.response_deadline!);
      return dateA.getTime() - dateB.getTime();
    });

  const signingDayDaysRemaining = signingDayDate ? getDaysRemaining(signingDayDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Decision Timeline
        </CardTitle>
        <CardDescription>Track important deadlines and countdown to signing day</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signing Day Countdown */}
        {signingDayDate && signingDayDaysRemaining !== null && isFuture(new Date(signingDayDate)) && (
          <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">National Signing Day</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(signingDayDate), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{signingDayDaysRemaining}</div>
                <div className="text-sm text-muted-foreground">days remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {pendingOffers.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Upcoming Response Deadlines</h4>
            {pendingOffers.map((offer) => {
              const daysRemaining = getDaysRemaining(offer.response_deadline!);
              const isOverdue = daysRemaining < 0;
              const deadline = new Date(offer.response_deadline!);

              return (
                <div
                  key={offer.id}
                  className={`p-3 rounded-lg border ${
                    isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{offer.schools.name}</span>
                        {isOverdue && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {offer.schools.location_city}, {offer.schools.location_state}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(deadline, "MMM d, yyyy")}
                        </span>
                      </div>
                      <Badge className={getUrgencyColor(daysRemaining)}>
                        {isOverdue
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : `${daysRemaining} days left`}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending deadlines</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionTimeline;
