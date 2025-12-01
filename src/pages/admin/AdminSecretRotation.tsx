import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, AlertTriangle, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SecretRotation {
  id: string;
  secret_name: string;
  last_rotated_at: string;
  rotation_frequency_days: number;
  next_rotation_due: string;
  is_critical: boolean;
  rotation_notes: string | null;
}

export default function AdminSecretRotation() {
  const [selectedSecret, setSelectedSecret] = useState<string | null>(null);
  const [rotationNotes, setRotationNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: secrets, isLoading } = useQuery({
    queryKey: ["secret-rotation-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secret_rotation_tracking")
        .select("*")
        .order("next_rotation_due", { ascending: true });

      if (error) throw error;
      return data as SecretRotation[];
    },
  });

  const markRotatedMutation = useMutation({
    mutationFn: async ({ secretName, notes }: { secretName: string; notes: string }) => {
      const { data, error } = await supabase.rpc("mark_secret_rotated", {
        p_secret_name: secretName,
        p_rotation_notes: notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Secret marked as rotated");
      queryClient.invalidateQueries({ queryKey: ["secret-rotation-tracking"] });
      setSelectedSecret(null);
      setRotationNotes("");
    },
    onError: (error) => {
      toast.error("Failed to mark secret as rotated");
      console.error(error);
    },
  });

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntil = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (secret: SecretRotation) => {
    const overdue = isOverdue(secret.next_rotation_due);
    const days = getDaysUntil(secret.next_rotation_due);

    if (overdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue ({Math.abs(days)} days)
        </Badge>
      );
    } else if (days <= 7) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-warning">
          <Clock className="h-3 w-3" />
          Due soon ({days} days)
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          OK ({days} days)
        </Badge>
      );
    }
  };

  const criticalSecrets = secrets?.filter(s => s.is_critical && isOverdue(s.next_rotation_due)) || [];
  const upcomingSecrets = secrets?.filter(s => !isOverdue(s.next_rotation_due) && getDaysUntil(s.next_rotation_due) <= 30) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Secret Rotation Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage API key and secret rotation schedules
          </p>
        </div>
      </div>

      {criticalSecrets.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Secrets Need Rotation
            </CardTitle>
            <CardDescription>
              These critical secrets are overdue for rotation and should be updated immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalSecrets.map((secret) => (
                <div key={secret.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <div>
                    <span className="font-medium">{secret.secret_name}</span>
                    <p className="text-sm text-muted-foreground">
                      Overdue by {Math.abs(getDaysUntil(secret.next_rotation_due))} days
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedSecret(secret.secret_name)}
                    variant="destructive"
                    size="sm"
                  >
                    Mark as Rotated
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingSecrets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Rotations (Next 30 Days)
            </CardTitle>
            <CardDescription>
              These secrets will need rotation soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingSecrets.map((secret) => (
                <div key={secret.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{secret.secret_name}</span>
                    <p className="text-sm text-muted-foreground">
                      Due in {getDaysUntil(secret.next_rotation_due)} days
                    </p>
                  </div>
                  {getStatusBadge(secret)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Secrets</CardTitle>
          <CardDescription>
            Complete list of tracked secrets and their rotation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading secrets...</div>
          ) : secrets && secrets.length > 0 ? (
            <div className="space-y-3">
              {secrets.map((secret) => (
                <div key={secret.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{secret.secret_name}</span>
                        {secret.is_critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Last rotated: {formatDistanceToNow(new Date(secret.last_rotated_at), { addSuffix: true })}</p>
                        <p>Rotation frequency: Every {secret.rotation_frequency_days} days</p>
                        {secret.rotation_notes && (
                          <p className="text-xs italic">Note: {secret.rotation_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(secret)}
                      <Button
                        onClick={() => setSelectedSecret(secret.secret_name)}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Mark Rotated
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No secrets tracked yet
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSecret} onOpenChange={() => setSelectedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Secret as Rotated</DialogTitle>
            <DialogDescription>
              Confirm that you have rotated <strong>{selectedSecret}</strong> in your external system.
              This will update the rotation tracking timestamp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Rotation Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this rotation (e.g., updated in Stripe dashboard)"
                value={rotationNotes}
                onChange={(e) => setRotationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSecret(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSecret) {
                  markRotatedMutation.mutate({
                    secretName: selectedSecret,
                    notes: rotationNotes,
                  });
                }
              }}
              disabled={markRotatedMutation.isPending}
            >
              {markRotatedMutation.isPending ? "Saving..." : "Confirm Rotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
