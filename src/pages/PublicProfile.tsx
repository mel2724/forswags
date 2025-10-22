import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, MapPin, Calendar, Trophy, GraduationCap, 
  Video, Target, Heart, Share2, Download, Home
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  url: string;
  media_type: string;
  display_order: number;
  season: string | null;
}

interface AthleteStat {
  id: string;
  stat_name: string;
  stat_value: number;
  season: string;
  category: string | null;
  unit: string | null;
  is_highlighted: boolean;
}

interface AthleteProfile {
  id: string;
  full_name: string;
  sport: string;
  position?: string;
  graduation_year?: number;
  height_in?: number;
  weight_lb?: number;
  high_school?: string;
  city?: string;
  state?: string;
  gpa?: number;
  sat_score?: number;
  act_score?: number;
  bio?: string;
  highlights_url?: string;
  profile_photo_url?: string;
  committed?: boolean;
  committed_school?: string;
  being_recruited?: boolean;
  recruiting_schools?: string[];
  received_offers?: boolean;
  offer_schools?: string[];
  athletic_awards?: string[];
  personal_description?: string;
  message_to_coaches?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  forty_yard_dash?: number;
  vertical_jump?: number;
  bench_press_max?: number;
  squat_max?: number;
}

export default function PublicProfile() {
  const { username, id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [introVideo, setIntroVideo] = useState<MediaAsset | null>(null);
  const [communityVideo, setCommunityVideo] = useState<MediaAsset | null>(null);
  const [gameVideos, setGameVideos] = useState<MediaAsset[]>([]);
  const [stats, setStats] = useState<AthleteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username, id]);

  const loadProfile = async () => {
    try {
      if (!username && !id) {
        setNotFound(true);
        return;
      }

      // Build query based on whether we have username or id
      let athleteQuery = supabase
        .from('athletes')
        .select('*')
        .eq('visibility', 'public');

      // Filter by username or id
      if (username) {
        athleteQuery = athleteQuery.eq('username', username);
      } else if (id) {
        athleteQuery = athleteQuery.eq('id', id);
      }

      const { data: athleteData, error: athleteError } = await athleteQuery.maybeSingle();

      if (athleteError) throw athleteError;

      if (!athleteData) {
        setNotFound(true);
        return;
      }

      // Fetch profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, city, state, avatar_url')
        .eq('id', athleteData.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      }

      // SECURITY: Check if athlete is a minor and hide social media handles
      const isMinor = athleteData.date_of_birth
        ? new Date().getFullYear() - new Date(athleteData.date_of_birth).getFullYear() < 18
        : false;

      // Combine athlete and profile data
      const combinedProfile: AthleteProfile = {
        id: athleteData.id,
        full_name: profileData?.full_name || '',
        city: profileData?.city,
        state: profileData?.state,
        ...athleteData,
        profile_photo_url: profileData?.avatar_url || athleteData.profile_photo_url,
        // SECURITY: Always hide social media handles for minors to prevent direct contact
        twitter_handle: isMinor ? undefined : athleteData.twitter_handle,
        instagram_handle: isMinor ? undefined : athleteData.instagram_handle,
        tiktok_handle: isMinor ? undefined : athleteData.tiktok_handle,
      };

      setProfile(combinedProfile);

      // Fetch media assets (introduction, community, and game videos)
      const { data: mediaData } = await supabase
        .from('media_assets')
        .select('*')
        .eq('athlete_id', athleteData.id)
        .in('media_type', ['introduction_video', 'community_video', 'game_video'])
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (mediaData) {
        setIntroVideo(mediaData.find(m => m.media_type === 'introduction_video') || null);
        setCommunityVideo(mediaData.find(m => m.media_type === 'community_video') || null);
        setGameVideos(mediaData.filter(m => m.media_type === 'game_video'));
      }

      // Fetch athlete stats
      const { data: statsData } = await supabase
        .from('athlete_stats')
        .select('id, stat_name, stat_value, season, category, unit, is_highlighted')
        .eq('athlete_id', athleteData.id)
        .order('season', { ascending: false })
        .order('is_highlighted', { ascending: false });

      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name} - ForSWAGs Profile`,
          text: `Check out ${profile?.full_name}'s athlete profile on ForSWAGs`,
          url,
        });
        toast.success('Profile shared successfully!');
      } catch (error: any) {
        // Only copy to clipboard if user didn't cancel
        if (error.name !== 'AbortError') {
          await copyToClipboard(url);
        }
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      // Fallback if clipboard API fails
      toast.error('Failed to copy link. Please copy manually: ' + text);
    }
  };

  const formatHeight = (inches?: number) => {
    if (!inches) return 'N/A';
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="rounded-full bg-muted p-6 w-fit mx-auto">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Profile Not Found</h2>
              <p className="text-muted-foreground">
                This athlete profile doesn't exist or is set to private.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Share Button Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Hero Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={profile.profile_photo_url || undefined} />
                <AvatarFallback className="text-4xl">
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{profile.full_name}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {profile.sport} {profile.position && `• ${profile.position}`}
                    </Badge>
                    {profile.graduation_year && (
                      <Badge variant="outline">Class of {profile.graduation_year}</Badge>
                    )}
                    {profile.committed && (
                      <Badge className="bg-green-500">
                        ✓ Committed {profile.committed_school && `to ${profile.committed_school}`}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {profile.high_school && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.high_school}</span>
                    </div>
                  )}
                  {(profile.city || profile.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {profile.height_in && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{formatHeight(profile.height_in)}</span>
                      {profile.weight_lb && <span>• {profile.weight_lb} lbs</span>}
                    </div>
                  )}
                  {profile.gpa && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.gpa.toFixed(2)} GPA</span>
                    </div>
                  )}
                </div>

                {profile.personal_description && (
                  <p className="text-muted-foreground">{profile.personal_description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Introduction Video */}
            {introVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {introVideo.title}
                  </CardTitle>
                  {introVideo.description && (
                    <p className="text-sm text-muted-foreground">{introVideo.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <video
                      src={introVideo.url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Community Involvement Video */}
            {communityVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    {communityVideo.title}
                  </CardTitle>
                  {communityVideo.description && (
                    <p className="text-sm text-muted-foreground">{communityVideo.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <video
                      src={communityVideo.url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {profile.highlights_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={profile.highlights_url}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Videos */}
            {gameVideos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Game Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gameVideos.map((video) => (
                    <div key={video.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{video.title}</h4>
                        {video.season && (
                          <Badge variant="secondary" className="text-xs">
                            {video.season}
                          </Badge>
                        )}
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                      )}
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        {video.url.includes("/media-assets/") ? (
                          <video
                            src={video.url}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <iframe
                            src={video.url}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Message to Coaches */}
            {profile.message_to_coaches && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Message to Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {profile.message_to_coaches}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Performance Stats */}
            {stats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Group stats by season */}
                    {Array.from(new Set(stats.map(s => s.season))).map((season) => (
                      <div key={season}>
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground">{season}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {stats
                            .filter(s => s.season === season)
                            .map((stat) => (
                              <div key={stat.id} className={stat.is_highlighted ? "col-span-1" : "col-span-1"}>
                                <p className="text-sm text-muted-foreground">{stat.stat_name}</p>
                                <p className={`text-2xl font-bold ${stat.is_highlighted ? 'text-primary' : ''}`}>
                                  {stat.stat_value}
                                  {stat.unit === 'percentage' && '%'}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Athletic Performance - Legacy fields */}
            {(profile.forty_yard_dash || profile.vertical_jump || profile.bench_press_max || profile.squat_max) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Athletic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {profile.forty_yard_dash && (
                      <div>
                        <p className="text-sm text-muted-foreground">40 Yard Dash</p>
                        <p className="text-2xl font-bold">{profile.forty_yard_dash}s</p>
                      </div>
                    )}
                    {profile.vertical_jump && (
                      <div>
                        <p className="text-sm text-muted-foreground">Vertical Jump</p>
                        <p className="text-2xl font-bold">{profile.vertical_jump}"</p>
                      </div>
                    )}
                    {profile.bench_press_max && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bench Press</p>
                        <p className="text-2xl font-bold">{profile.bench_press_max} lbs</p>
                      </div>
                    )}
                    {profile.squat_max && (
                      <div>
                        <p className="text-sm text-muted-foreground">Squat</p>
                        <p className="text-2xl font-bold">{profile.squat_max} lbs</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Academics */}
            {(profile.gpa || profile.sat_score || profile.act_score) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4" />
                    Academics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.gpa && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">GPA</span>
                      <span className="font-medium">{profile.gpa.toFixed(2)}</span>
                    </div>
                  )}
                  {profile.sat_score && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">SAT</span>
                      <span className="font-medium">{profile.sat_score}</span>
                    </div>
                  )}
                  {profile.act_score && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ACT</span>
                      <span className="font-medium">{profile.act_score}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recruitment Status */}
            {(profile.being_recruited || profile.received_offers || profile.committed) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" />
                    Recruitment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.committed && (
                    <div>
                      <Badge className="bg-green-500 mb-2">✓ Committed</Badge>
                      {profile.committed_school && (
                        <p className="text-sm font-medium">{profile.committed_school}</p>
                      )}
                    </div>
                  )}
                  {!profile.committed && profile.received_offers && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Offers From:</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.offer_schools?.map((school, idx) => (
                          <Badge key={idx} variant="secondary">{school}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {!profile.committed && profile.being_recruited && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Recruiting Interest:</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.recruiting_schools?.map((school, idx) => (
                          <Badge key={idx} variant="outline">{school}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Media - For Recruiting Purposes */}
            {(profile.twitter_handle || profile.instagram_handle || profile.tiktok_handle) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Share2 className="h-4 w-4" />
                    Social Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.twitter_handle && (
                    <a
                      href={`https://twitter.com/${profile.twitter_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <span className="text-muted-foreground">Twitter:</span>
                      <span>{profile.twitter_handle}</span>
                    </a>
                  )}
                  {profile.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <span className="text-muted-foreground">Instagram:</span>
                      <span>{profile.instagram_handle}</span>
                    </a>
                  )}
                  {profile.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${profile.tiktok_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <span className="text-muted-foreground">TikTok:</span>
                      <span>{profile.tiktok_handle}</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information - Removed for Privacy */}
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-sm font-medium">Interested in recruiting this athlete?</p>
                <p className="text-xs text-muted-foreground">
                  Connect through our platform for direct communication
                </p>
                <Button onClick={() => navigate('/')} className="w-full">
                  Go to ForSWAGs
                </Button>
              </CardContent>
            </Card>

            {/* Awards */}
            {profile.athletic_awards && profile.athletic_awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4" />
                    Awards & Honors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {profile.athletic_awards.map((award, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{award}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}