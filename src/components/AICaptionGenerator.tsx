import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Copy, RefreshCw, Crown } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useNavigate } from "react-router-dom";

interface AICaptionGeneratorProps {
  onCaptionGenerated?: (caption: string) => void;
}

export const AICaptionGenerator = ({ onCaptionGenerated }: AICaptionGeneratorProps) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { hasAccess, isLoading } = useFeatureAccess("ai_caption_generator");

  const generateCaption = async () => {
    if (!hasAccess) {
      toast.error("This feature requires a paid membership");
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a description of your post');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-caption', {
        body: {
          prompt: prompt.trim(),
          context: context.trim(),
          tone,
          maxLength: 280,
        },
      });

      if (error) throw error;

      const caption = data.caption;
      setGeneratedCaption(caption);
      
      if (onCaptionGenerated) {
        onCaptionGenerated(caption);
      }

      toast.success('Caption generated successfully!');
    } catch (error: any) {
      console.error('Error generating caption:', error);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate caption. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedCaption) return;
    navigator.clipboard.writeText(generatedCaption);
    toast.success('Caption copied to clipboard!');
  };

  const examplePrompts = [
    "Announce my game-winning touchdown",
    "Share my training session progress",
    "Celebrate my college offer",
    "Post about my team's championship win",
    "Highlight my academic achievement",
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Caption Generator
              </CardTitle>
              <CardDescription>Premium Feature - Requires Paid Membership</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let AI help you create engaging captions for your social media posts with unlimited generations, multiple tone options, and context-aware suggestions.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Unlimited AI-powered captions</span>
            </li>
            <li className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span>Multiple tone options</span>
            </li>
            <li className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              <span>Easy copy & paste</span>
            </li>
          </ul>
          <Button onClick={() => navigate("/membership")} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Access
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Caption Generator
        </CardTitle>
        <CardDescription>
          Let AI help you create engaging captions for your social media posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">What do you want to post about?</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'I just committed to State University' or 'Had an amazing training session today'"
            rows={3}
            maxLength={500}
          />
          <div className="flex flex-wrap gap-2">
            <p className="text-xs text-muted-foreground w-full">Try these:</p>
            {examplePrompts.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPrompt(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="motivational">Motivational</SelectItem>
                <SelectItem value="grateful">Grateful</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'Include my position and graduation year'"
              rows={1}
              maxLength={200}
            />
          </div>
        </div>

        <Button
          onClick={generateCaption}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Caption
            </>
          )}
        </Button>

        {generatedCaption && (
          <div className="space-y-2">
            <Label>Generated Caption</Label>
            <div className="relative rounded-lg border bg-muted p-4">
              <p className="text-sm whitespace-pre-wrap pr-8">{generatedCaption}</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateCaption}
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Regenerate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="mr-2 h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Tips for better captions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Be specific about your achievement or activity</li>
            <li>Mention relevant details (sport, position, stats)</li>
            <li>Add context about why it matters to you</li>
            <li>The AI will automatically include appropriate hashtags</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};