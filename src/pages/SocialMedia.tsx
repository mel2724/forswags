import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Share2, Facebook, Twitter, Instagram, Lightbulb, TrendingUp, Target, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SocialMediaGraphicGenerator } from "@/components/SocialMediaGraphicGenerator";
import { toast } from "sonner";

const FORSWAGS_TAG = "#ForSWAGsNation";
const FORSWAGS_HANDLES = {
  twitter: "@ForSWAGs",
  facebook: "@ForSWAGs",
  instagram: "@ForSWAGs",
  tiktok: "@ForSWAGs",
};

const SUGGESTED_HASHTAGS = [
  // ForSWAGs branded
  { tag: "#ForSWAGsNation", category: "ForSWAGs", description: "Official ForSWAGs hashtag" },
  { tag: "#ForSWAGsAthlete", category: "ForSWAGs", description: "ForSWAGs athlete community" },
  { tag: "#BuildingChampions", category: "ForSWAGs", description: "ForSWAGs mission" },
  
  // Recruiting
  { tag: "#Committed", category: "Recruiting", description: "College commitment" },
  { tag: "#Recruited", category: "Recruiting", description: "Recruitment process" },
  { tag: "#D1Bound", category: "Recruiting", description: "Division 1 prospect" },
  { tag: "#NextLevel", category: "Recruiting", description: "College athletics" },
  { tag: "#RecruitMe", category: "Recruiting", description: "Open to recruitment" },
  
  // Training & Performance
  { tag: "#TrainHard", category: "Training", description: "Training dedication" },
  { tag: "#Grind", category: "Training", description: "Work ethic" },
  { tag: "#NoOffSeason", category: "Training", description: "Year-round training" },
  { tag: "#AthleteLife", category: "Training", description: "Athletic lifestyle" },
  
  // Achievement
  { tag: "#Blessed", category: "Achievement", description: "Grateful for opportunity" },
  { tag: "#DreamsComeTrue", category: "Achievement", description: "Milestone reached" },
  { tag: "#HardWorkPaysOff", category: "Achievement", description: "Success through effort" },
  
  // General Sports
  { tag: "#StudentAthlete", category: "General", description: "Balancing academics and athletics" },
  { tag: "#Athletics", category: "General", description: "General athletics" },
  { tag: "#SportsLife", category: "General", description: "Athletic lifestyle" },
];

const SOCIAL_TIPS = [
  {
    icon: Target,
    title: "Post Consistently",
    description: "Share 3-5 times per week to stay visible to recruiters and build your brand."
  },
  {
    icon: TrendingUp,
    title: "Use Hashtags Strategically",
    description: "Include sport-specific hashtags, your graduation year, and position for maximum visibility."
  },
  {
    icon: Lightbulb,
    title: "Show Personality",
    description: "Balance athletic content with academics, community service, and personal interests."
  },
  {
    icon: Sparkles,
    title: "Tag Schools & Coaches",
    description: "When appropriate, tag colleges and coaches you're interested in to increase visibility."
  },
];

export default function SocialMedia() {
  const [loading, setLoading] = useState(true);
  const [athleteInfo, setAthleteInfo] = useState({ name: "", sport: "" });
  const [postContent, setPostContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAthleteInfo();
  }, []);

  const fetchAthleteInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get athlete info for graphic generator
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: athlete } = await supabase
        .from("athletes")
        .select("sport")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile || athlete) {
        setAthleteInfo({
          name: profile?.full_name || "",
          sport: athlete?.sport || "",
        });
      }
    } catch (error) {
      console.error("Error loading athlete info:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPostContent = (content: string): string => {
    const handle = FORSWAGS_HANDLES.twitter;
    return `${content}\n\n${handle} ${FORSWAGS_TAG}`;
  };

  const shareToTwitter = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }
    const formattedContent = formatPostContent(postContent);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedContent)}`;
    window.open(url, "_blank");
    toast.success("Opening Twitter to share your post!");
  };

  const shareToFacebook = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }
    const formattedContent = formatPostContent(postContent);
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(formattedContent)}`;
    window.open(url, "_blank");
    toast.success("Opening Facebook to share your post!");
  };

  const shareToInstagram = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }
    const formattedContent = formatPostContent(postContent);
    navigator.clipboard.writeText(formattedContent);
    toast.success("Content copied! Open Instagram and paste your post", {
      description: "The caption has been copied to your clipboard with ForSWAGs branding"
    });
  };

  const shareToTikTok = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }
    const formattedContent = formatPostContent(postContent);
    navigator.clipboard.writeText(formattedContent);
    toast.success("Content copied! Open TikTok and paste your post", {
      description: "The caption has been copied to your clipboard with ForSWAGs branding"
    });
  };

  const addHashtag = (hashtag: string) => {
    // Trim and validate
    const trimmedHashtag = hashtag.trim();
    if (!trimmedHashtag) return;
    
    // Check if hashtag already exists in content
    if (postContent.includes(trimmedHashtag)) {
      toast.info("This hashtag is already in your post");
      return;
    }
    
    // Add hashtag to content
    const newContent = postContent.trim() 
      ? `${postContent.trim()} ${trimmedHashtag}`
      : trimmedHashtag;
    
    setPostContent(newContent);
    toast.success("Hashtag added!");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Social Media Content Creator</h1>
        <p className="text-muted-foreground">
          Create professional graphics and content to share on Instagram, Facebook, Twitter, and TikTok
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">
            <Sparkles className="mr-2 h-4 w-4" />
            Graphic Generator
          </TabsTrigger>
          <TabsTrigger value="post">
            <Share2 className="mr-2 h-4 w-4" />
            Create Post
          </TabsTrigger>
          <TabsTrigger value="tips">
            <Lightbulb className="mr-2 h-4 w-4" />
            Tips & Best Practices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4 mt-6">
          <SocialMediaGraphicGenerator 
            athleteName={athleteInfo.name}
            athleteSport={athleteInfo.sport}
          />
        </TabsContent>

        <TabsContent value="post" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Quick Post Creator
              </CardTitle>
              <CardDescription>
                Write your post content and share directly to your favorite platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="postContent">Post Content</Label>
                <Textarea
                  id="postContent"
                  placeholder="Share your achievements, training updates, game highlights, or milestones..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  ForSWAGs branding (@ForSWAGs #ForSWAGsNation) will be automatically added
                </p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Suggested Hashtags
                </Label>
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">ForSWAGs Official</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_HASHTAGS.filter(h => h.category === "ForSWAGs").map((hashtag) => (
                        <Badge
                          key={hashtag.tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => addHashtag(hashtag.tag)}
                        >
                          {hashtag.tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recruiting</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_HASHTAGS.filter(h => h.category === "Recruiting").map((hashtag) => (
                        <Badge
                          key={hashtag.tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors"
                          onClick={() => addHashtag(hashtag.tag)}
                        >
                          {hashtag.tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Training & Achievement</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_HASHTAGS.filter(h => h.category === "Training" || h.category === "Achievement").map((hashtag) => (
                        <Badge
                          key={hashtag.tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors"
                          onClick={() => addHashtag(hashtag.tag)}
                        >
                          {hashtag.tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">General Sports</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_HASHTAGS.filter(h => h.category === "General").map((hashtag) => (
                        <Badge
                          key={hashtag.tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors"
                          onClick={() => addHashtag(hashtag.tag)}
                        >
                          {hashtag.tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Click any hashtag to add it to your post. Mix ForSWAGs hashtags with relevant sports tags for maximum reach!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Share To:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={shareToTwitter}
                    className="w-full"
                    variant="outline"
                  >
                    <Twitter className="mr-2 h-4 w-4" />
                    Share to Twitter/X
                  </Button>
                  <Button
                    onClick={shareToFacebook}
                    className="w-full"
                    variant="outline"
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Share to Facebook
                  </Button>
                  <Button
                    onClick={shareToInstagram}
                    className="w-full"
                    variant="outline"
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    Copy for Instagram
                  </Button>
                  <Button
                    onClick={shareToTikTok}
                    className="w-full"
                    variant="outline"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy for TikTok
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Instagram and TikTok don't support direct web posting. Content will be copied to your clipboard.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Preview with ForSWAGs Branding:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {postContent || "Your post content will appear here..."}
                  {postContent && `\n\n@ForSWAGs #ForSWAGsNation`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {SOCIAL_TIPS.map((tip, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <tip.icon className="h-5 w-5 text-primary" />
                    {tip.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Best Posting Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm mb-1">Weekdays</p>
                  <p className="text-sm text-muted-foreground">6-9 AM and 5-8 PM</p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Weekends</p>
                  <p className="text-sm text-muted-foreground">9 AM - 12 PM</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                These times typically see the highest engagement from coaches and recruiters
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                Content Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Game highlights and statistics</li>
                <li>• Training videos and workout updates</li>
                <li>• Academic achievements and awards</li>
                <li>• Community service activities</li>
                <li>• Team celebrations and milestones</li>
                <li>• Behind-the-scenes training footage</li>
                <li>• Recruitment updates and college visits</li>
                <li>• Personal growth and goal-setting posts</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
