import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, GraduationCap, Linkedin, MessageCircle, Phone, Trophy } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AlumniCardProps {
  alumni: {
    id: string;
    user_id: string;
    school_id: string;
    graduation_year: number;
    sport: string;
    position?: string;
    professional_role?: string;
    company?: string;
    linkedin_url?: string;
    bio?: string;
    willing_to_mentor: boolean;
    available_for_calls: boolean;
    profiles?: {
      full_name?: string;
      avatar_url?: string;
    };
    schools?: {
      name: string;
    };
  };
  athleteId?: string;
  onConnect?: () => void;
}

export function AlumniCard({ alumni, athleteId, onConnect }: AlumniCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!athleteId) {
      toast({
        title: "Error",
        description: "You must be logged in as an athlete to connect",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please include a message with your connection request",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('alumni_connections')
        .insert({
          athlete_id: athleteId,
          alumni_id: alumni.id,
          message: message.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Connection Request Sent",
        description: `Your request to connect with ${alumni.profiles?.full_name || 'this alumni'} has been sent.`,
      });
      
      setIsOpen(false);
      setMessage("");
      onConnect?.();
    } catch (error) {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initials = alumni.profiles?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{alumni.profiles?.full_name || 'Alumni Member'}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>{alumni.schools?.name} '{alumni.graduation_year.toString().slice(-2)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {alumni.willing_to_mentor && (
              <Badge variant="secondary" className="text-xs">Mentor</Badge>
            )}
            {alumni.available_for_calls && (
              <Badge variant="outline" className="text-xs">Open to Calls</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{alumni.sport}</span>
            {alumni.position && (
              <Badge variant="outline" className="text-xs">{alumni.position}</Badge>
            )}
          </div>
          
          {alumni.professional_role && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{alumni.professional_role}</span>
              {alumni.company && <span className="text-muted-foreground">at {alumni.company}</span>}
            </div>
          )}
        </div>

        {alumni.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{alumni.bio}</p>
        )}

        <div className="flex gap-2 pt-2">
          {alumni.linkedin_url && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(alumni.linkedin_url, '_blank')}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
          )}
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect with {alumni.profiles?.full_name}</DialogTitle>
                <DialogDescription>
                  Send a message to introduce yourself and explain why you'd like to connect.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="Hi, I'm interested in learning more about your experience at..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnect} disabled={isLoading || !message.trim()}>
                  {isLoading ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
