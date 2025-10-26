import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface PrimeDimeAdvisorProps {
  athleteId: string;
  onComplete: () => void;
}

export function PrimeDimeAdvisor({ athleteId, onComplete }: PrimeDimeAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Fetch athlete profile to show what we already know
        const { data: athlete } = await supabase
          .from('athletes')
          .select('sport, position, gpa, sat_score, act_score')
          .eq('id', athleteId)
          .single();

        const { data: stats } = await supabase
          .from('athlete_stats')
          .select('stat_name, stat_value')
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false })
          .limit(3);

        let profileInfo = "";
        const knownItems: string[] = [];
        
        if (athlete?.sport && athlete?.position) {
          knownItems.push(`you play ${athlete.sport} at ${athlete.position}`);
        }
        if (athlete?.gpa) {
          knownItems.push(`your GPA is ${athlete.gpa}`);
        }
        if (athlete?.sat_score || athlete?.act_score) {
          const score = athlete.sat_score ? `SAT: ${athlete.sat_score}` : `ACT: ${athlete.act_score}`;
          knownItems.push(`your test score: ${score}`);
        }

        if (knownItems.length > 0) {
          profileInfo = `\n\nBased on your profile, I already know ${knownItems.join(", ")}. This means we can skip some questions and focus on what matters most to you! 🎯`;
        }

        setMessages([{
          role: "assistant",
          content: `Hey there! I'm your Prime Dime advisor. I'll help you find your perfect college match by asking you some questions about what matters most to you.${profileInfo}\n\nReady to get started?`
        }]);
      } catch (error) {
        console.error('Error loading profile:', error);
        setMessages([{
          role: "assistant",
          content: "Hey there! I'm your Prime Dime advisor. I'll help you find your perfect college match by asking you some questions. Ready to get started? 🎯"
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [athleteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('prime-dime-advisor', {
        body: {
          athleteId,
          messages: [...messages, { role: "user", content: userMessage }]
        }
      });

      if (error) throw error;

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message
      }]);

      // Check if conversation is complete
      if (data.completed) {
        toast.success("Conversation complete! Generating your recommendations...");
        setTimeout(onComplete, 2000);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setIsTyping(false);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-16rem)] min-h-[500px] max-h-[700px]">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-secondary/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Prime Dime Advisor</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your personal college match consultant
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="border-t p-4 flex-shrink-0 bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 w-full"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
