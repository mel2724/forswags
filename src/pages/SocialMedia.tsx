import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Share2, Facebook, Twitter, Instagram, Lightbulb, TrendingUp, Target, Hash, FileText, Linkedin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SocialMediaGraphicGenerator } from "@/components/SocialMediaGraphicGenerator";
import { ContentCalendar } from "@/components/ContentCalendar";
import { AICaptionGenerator } from "@/components/AICaptionGenerator";
import { HashtagPerformance } from "@/components/HashtagPerformance";
import { SocialAccountsManager } from "@/components/SocialAccountsManager";
import { PostTemplatesLibrary } from "@/components/PostTemplatesLibrary";
import { PressReleaseGenerator } from "@/components/PressReleaseGenerator";
import { toast } from "sonner";

type Platform = 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin';

const PLATFORM_LIMITS = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  linkedin: 3000,
};

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
  const [activeTab, setActiveTab] = useState("generator");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAthleteInfo();
    
    // Check if we're coming from Prime Dime page with matches
    const state = location.state as { primeDimeMatches?: any[] };
    if (state?.primeDimeMatches && state.primeDimeMatches.length > 0) {
      setActiveTab("post");
      // Don't auto-generate - let user select platform first
    }
  }, [location]);

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

  const sanitizeContent = (content: string): string => {
    // Remove potential XSS patterns
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const shareToTwitter = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }

    // Validate length
    if (postContent.length > PLATFORM_LIMITS.twitter) {
      toast.error(`Twitter posts must be ${PLATFORM_LIMITS.twitter} characters or less`);
      return;
    }

    // Rate limiting check
    const lastPostKey = 'lastTwitterPost';
    const lastPost = localStorage.getItem(lastPostKey);
    if (lastPost && Date.now() - parseInt(lastPost) < 60000) {
      toast.error("Please wait a minute before posting again");
      return;
    }
    
    try {
      const sanitizedContent = sanitizeContent(postContent);
      const formattedContent = formatPostContent(sanitizedContent);
      
      const { data, error } = await supabase.functions.invoke('twitter-post', {
        body: { text: formattedContent }
      });

      if (error) throw error;

      localStorage.setItem(lastPostKey, Date.now().toString());
      toast.success("Posted to Twitter successfully!");
      setPostContent("");
    } catch (error: any) {
      console.error('Twitter post error:', error);
      // Fallback to Twitter intent
      const formattedContent = formatPostContent(postContent);
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedContent)}`;
      window.open(url, "_blank");
      toast.info("Please connect your Twitter account in the Accounts tab for direct posting");
    }
  };

  const shareToFacebook = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }

    if (postContent.length > PLATFORM_LIMITS.facebook) {
      toast.error(`Facebook posts must be ${PLATFORM_LIMITS.facebook} characters or less`);
      return;
    }

    const sanitizedContent = sanitizeContent(postContent);
    const formattedContent = formatPostContent(sanitizedContent);
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(formattedContent)}`;
    window.open(url, "_blank");
    toast.success("Opening Facebook to share your post!");
  };

  const shareToInstagram = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }

    if (postContent.length > PLATFORM_LIMITS.instagram) {
      toast.error(`Instagram posts must be ${PLATFORM_LIMITS.instagram} characters or less`);
      return;
    }
    
    const sanitizedContent = sanitizeContent(postContent);
    const formattedContent = formatPostContent(sanitizedContent);
    navigator.clipboard.writeText(formattedContent);
    toast.success("Content copied! Open Instagram and paste your post", {
      description: "The caption has been copied to your clipboard with ForSWAGs branding. To post directly, use the Graphics tab to create an image first."
    });
  };

  const shareToTikTok = () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }

    if (postContent.length > PLATFORM_LIMITS.tiktok) {
      toast.error(`TikTok posts must be ${PLATFORM_LIMITS.tiktok} characters or less`);
      return;
    }

    const sanitizedContent = sanitizeContent(postContent);
    const formattedContent = formatPostContent(sanitizedContent);
    navigator.clipboard.writeText(formattedContent);
    toast.success("Content copied! Open TikTok and paste your post", {
      description: "The caption has been copied to your clipboard with ForSWAGs branding"
    });
  };

  const generatePlatformSpecificPost = (matches: any[], platform: Platform) => {
    const collegeList = matches.slice(0, 3).map((c: any) => c.name);
    
    let postText = '';
    
    switch (platform) {
      case 'twitter':
        // Ultra-concise for 280 char limit
        postText = `🎯 Top college matches:\n1. ${collegeList[0]}\n2. ${collegeList[1]}\nReady for the next level! #D1Bound #RecruitMe`;
        break;
        
      case 'instagram':
        // Visual-first, emoji-heavy
        postText = `🎯✨ MY TOP 3 PRIME DIME COLLEGE MATCHES! ✨🎯

After working with @ForSWAGs expert team, I found my perfect fits:

🏆 ${collegeList[0]}
🏆 ${collegeList[1]}
🏆 ${collegeList[2]}

These schools align perfectly with my athletic, academic, and personal goals! 💪

Ready to take the next step in my recruiting journey! 🔥

👇 Comment your favorite school below!

#PrimeDime #CollegeRecruiting #D1Bound #RecruitMe #StudentAthlete #NextLevel #ForSWAGs`;
        break;
        
      case 'facebook':
        // Longer narrative style
        postText = `🎯 Excited to Share My College Journey Update!

After months of hard work both on the field and in the classroom, I'm thrilled to announce that I've completed my Prime Dime college analysis with ForSWAGs!

Through their comprehensive evaluation process, we've identified my top 3 college matches:

✅ ${collegeList[0]}
✅ ${collegeList[1]}
✅ ${collegeList[2]}

Each of these schools offers exactly what I'm looking for - the right balance of athletic competition, academic programs, campus culture, and personal fit.

I'm incredibly grateful to my family, coaches, and the ForSWAGs team for their support throughout this process. The next chapter is going to be amazing!

Stay tuned for more updates on my recruiting journey! 🏆💪

#CollegeRecruiting #StudentAthlete #PrimeDime #RecruitingJourney`;
        break;
        
      case 'tiktok':
        // Casual, Gen-Z style
        postText = `POV: You just found your dream colleges 🎯✨

My top 3 Prime Dime matches:
1. ${collegeList[0]} 🏆
2. ${collegeList[1]} 🏆
3. ${collegeList[2]} 🏆

Not me actually finding the perfect fit schools 😭💪

Big thanks to @ForSWAGs for the analysis! The recruiting journey is getting real! 🔥

Who else is on their college search journey? Drop your sport below! 👇

#CollegeRecruiting #StudentAthlete #PrimeDime #D1Bound #CollegeBound #ForYouPage`;
        break;
        
      case 'linkedin':
        // Professional tone
        postText = `🎓 College Search Milestone: Prime Dime Analysis Complete

I am pleased to announce the completion of my comprehensive college matching analysis through ForSWAGs' Prime Dime program. After careful evaluation of athletic opportunities, academic offerings, and institutional fit, I have identified my top three target schools:

• ${collegeList[0]}
• ${collegeList[1]}
• ${collegeList[2]}

This data-driven approach has provided valuable insights into programs that align with both my immediate athletic goals and long-term career aspirations. Each institution offers strong programs in my intended field of study, competitive athletic opportunities at my skill level, and campus environments that match my personal values.

I look forward to continuing this journey and am grateful for the guidance of my coaches, family, and the ForSWAGs team throughout this process.

#StudentAthlete #CollegeRecruiting #CareerDevelopment #AthleticRecruiting #PrimeDime`;
        break;
    }
    
    setPostContent(postText);
    toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} post generated!`);
  };

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    
    // If we have Prime Dime matches in state, regenerate the post
    const state = location.state as { primeDimeMatches?: any[] };
    if (state?.primeDimeMatches && state.primeDimeMatches.length > 0) {
      generatePlatformSpecificPost(state.primeDimeMatches, platform);
    }
  };

  const getCharacterCount = () => {
    return postContent.length;
  };

  const getCharacterLimit = () => {
    return PLATFORM_LIMITS[selectedPlatform];
  };

  const isOverLimit = () => {
    return getCharacterCount() > getCharacterLimit();
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
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Social Media Content Creator</h1>
        <p className="text-muted-foreground">
          Create professional graphics and content to share on Instagram, Facebook, Twitter, and TikTok
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 h-auto p-2">
          <TabsTrigger value="generator" className="flex-1">
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Graphics</span>
          </TabsTrigger>
          <TabsTrigger value="post" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Quick Post</span>
          </TabsTrigger>
          <TabsTrigger value="ai-caption" className="flex-1">
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">AI Captions</span>
          </TabsTrigger>
          <TabsTrigger value="press-release" className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Press Release</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex-1">
            <Hash className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Hashtags</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex-1">
            <Lightbulb className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Tips</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4 mt-8">
          <SocialMediaGraphicGenerator 
            athleteName={athleteInfo.name}
            athleteSport={athleteInfo.sport}
          />
        </TabsContent>

        <TabsContent value="post" className="space-y-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Quick Post Creator
              </CardTitle>
              <CardDescription>
                Select your platform and generate optimized content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Selector */}
              <div className="space-y-3">
                <Label>Select Platform</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button
                    variant={selectedPlatform === 'twitter' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handlePlatformChange('twitter')}
                  >
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter/X
                  </Button>
                  <Button
                    variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handlePlatformChange('instagram')}
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    Instagram
                  </Button>
                  <Button
                    variant={selectedPlatform === 'facebook' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handlePlatformChange('facebook')}
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant={selectedPlatform === 'tiktok' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handlePlatformChange('tiktok')}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    TikTok
                  </Button>
                  <Button
                    variant={selectedPlatform === 'linkedin' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handlePlatformChange('linkedin')}
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Character limit: {getCharacterLimit().toLocaleString()}</span>
                  <span className={isOverLimit() ? 'text-destructive font-semibold' : ''}>
                    {getCharacterCount()} / {getCharacterLimit().toLocaleString()}
                  </span>
                </div>
                {isOverLimit() && (
                  <p className="text-xs text-destructive">
                    ⚠️ Your post exceeds the {selectedPlatform} character limit. Please shorten it.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postContent">Post Content</Label>
                <Textarea
                  id="postContent"
                  placeholder={`Write your ${selectedPlatform} post here...`}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={10}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Content is optimized for {selectedPlatform}. ForSWAGs branding included where appropriate.
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

        <TabsContent value="ai-caption" className="space-y-4 mt-8">
          <AICaptionGenerator onCaptionGenerated={(caption) => setPostContent(caption)} />
        </TabsContent>

        <TabsContent value="press-release" className="space-y-4 mt-8">
          <PressReleaseGenerator />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-8">
          <ContentCalendar />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-8">
          <PostTemplatesLibrary onTemplateSelect={(template) => {
            setPostContent(template.content_template);
            toast.info('Template loaded! Fill in the placeholders with your details.');
          }} />
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4 mt-8">
          <HashtagPerformance />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4 mt-8">
          <SocialAccountsManager />
        </TabsContent>

        <TabsContent value="tips" className="space-y-4 mt-8">
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
