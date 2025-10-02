import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ProfileActions } from "@/components/ProfileActions";
import logoIcon from "@/assets/forswags-logo.png";
import {
  User, Trophy, GraduationCap, Video, ArrowLeft, Save,
  Loader2, LogOut, Ruler, Weight, Award, Target, Heart, Users as UsersIcon, Phone
} from "lucide-react";

const sports = [
  "Football", "Basketball", "Baseball", "Softball", "Soccer",
  "Track & Field", "Volleyball", "Lacrosse", "Tennis",
  "Swimming", "Wrestling", "Golf", "Cross Country", "Other"
];

export default function ProfileComprehensive() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");

  // Athletic Information
  const [username, setUsername] = useState("");
  const [sport, setSport] = useState("");
  const [secondarySports, setSecondarySports] = useState<string[]>([]);
  const [position, setPosition] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [filledOutBy, setFilledOutBy] = useState("");

  // Academic Information
  const [highSchool, setHighSchool] = useState("");
  const [clubTeam, setClubTeam] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [gpa, setGpa] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [ncaaNumber, setNcaaNumber] = useState("");
  const [academicAchievements, setAcademicAchievements] = useState("");
  const [favoriteSubject, setFavoriteSubject] = useState("");
  const [hasHonors, setHasHonors] = useState(false);
  const [honorsCourses, setHonorsCourses] = useState("");
  const [legalSituations, setLegalSituations] = useState(false);
  const [legalExplanation, setLegalExplanation] = useState("");

  // Performance Metrics
  const [fortyYard, setFortyYard] = useState("");
  const [verticalJump, setVerticalJump] = useState("");
  const [benchPress, setBenchPress] = useState("");
  const [squat, setSquat] = useState("");
  const [athleticAwards, setAthleticAwards] = useState<string[]>([]);
  const [leadershipRoles, setLeadershipRoles] = useState("");
  const [notablePerformances, setNotablePerformances] = useState("");

  // Recruiting
  const [beingRecruited, setBeingRecruited] = useState(false);
  const [recruitingSchools, setRecruitingSchools] = useState<string[]>([]);
  const [receivedOffers, setReceivedOffers] = useState(false);
  const [offerSchools, setOfferSchools] = useState<string[]>([]);
  const [committed, setCommitted] = useState(false);
  const [committedSchool, setCommittedSchool] = useState("");
  const [campsAttended, setCampsAttended] = useState<string[]>([]);
  const [upcomingCamps, setUpcomingCamps] = useState<string[]>([]);

  // Social Media
  const [twitterHandle, setTwitterHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");

  // Personal Development
  const [personalDescription, setPersonalDescription] = useState("");
  const [fiveYearGoals, setFiveYearGoals] = useState("");
  const [motivation, setMotivation] = useState("");
  const [challenges, setChallenges] = useState("");
  const [roleModel, setRoleModel] = useState("");
  const [communityInvolvement, setCommunityInvolvement] = useState("");
  const [messageToCoaches, setMessageToCoaches] = useState("");

  // Media
  const [highlightsUrl, setHighlightsUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);
    setEmail(session.user.email || "");

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileData) {
      setFullName(profileData.full_name || "");
      setPhone(profileData.phone || "");
      setDateOfBirth(profileData.date_of_birth || "");
      setGender(profileData.gender || "");
      setCity(profileData.city || "");
      setState(profileData.state || "");
      setCountry(profileData.country || "United States");
    }

    // Load athlete data
    const { data: athleteData } = await supabase
      .from("athletes")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (athleteData) {
      setAthleteId(athleteData.id);
      setUsername(athleteData.username || "");
      setNickname(athleteData.nickname || "");
      setSport(athleteData.sport || "");
      setSecondarySports(athleteData.secondary_sports || []);
      setPosition(athleteData.position || "");
      setWeight(athleteData.weight_lb?.toString() || "");
      setJerseyNumber(athleteData.jersey_number || "");
      setFilledOutBy(athleteData.filled_out_by || "");
      setHighSchool(athleteData.high_school || "");
      setClubTeam(athleteData.club_team_name || "");
      setGradYear(athleteData.graduation_year?.toString() || "");
      setGpa(athleteData.gpa?.toString() || "");
      setSatScore(athleteData.sat_score?.toString() || "");
      setActScore(athleteData.act_score?.toString() || "");
      setNcaaNumber(athleteData.ncaa_eligibility_number || "");
      setAcademicAchievements(athleteData.academic_achievements || "");
      setFavoriteSubject(athleteData.favorite_subject || "");
      setHasHonors(athleteData.has_honors_ap_ib || false);
      setHonorsCourses(athleteData.honors_courses || "");
      setLegalSituations(athleteData.legal_situations || false);
      setLegalExplanation(athleteData.legal_situations_explanation || "");
      setFortyYard(athleteData.forty_yard_dash?.toString() || "");
      setVerticalJump(athleteData.vertical_jump?.toString() || "");
      setBenchPress(athleteData.bench_press_max?.toString() || "");
      setSquat(athleteData.squat_max?.toString() || "");
      setAthleticAwards(athleteData.athletic_awards || []);
      setLeadershipRoles(athleteData.leadership_roles || "");
      setNotablePerformances(athleteData.notable_performances || "");
      setBeingRecruited(athleteData.being_recruited || false);
      setRecruitingSchools(athleteData.recruiting_schools || []);
      setReceivedOffers(athleteData.received_offers || false);
      setOfferSchools(athleteData.offer_schools || []);
      setCommitted(athleteData.committed || false);
      setCommittedSchool(athleteData.committed_school || "");
      setCampsAttended(athleteData.camps_attended || []);
      setUpcomingCamps(athleteData.upcoming_camps || []);
      setTwitterHandle(athleteData.twitter_handle || "");
      setInstagramHandle(athleteData.instagram_handle || "");
      setTiktokHandle(athleteData.tiktok_handle || "");
      setPersonalDescription(athleteData.personal_description || "");
      setFiveYearGoals(athleteData.five_year_goals || "");
      setMotivation(athleteData.motivation || "");
      setChallenges(athleteData.challenges_overcome || "");
      setRoleModel(athleteData.role_model || "");
      setCommunityInvolvement(athleteData.community_involvement || "");
      setMessageToCoaches(athleteData.message_to_coaches || "");
      setHighlightsUrl(athleteData.highlights_url || "");
      setBio(athleteData.bio || "");

      if (athleteData.height_in) {
        const feet = Math.floor(athleteData.height_in / 12);
        const inches = athleteData.height_in % 12;
        setHeightFeet(feet.toString());
        setHeightInches(inches.toString());
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const handleSave = async () => {
    if (!userId || !athleteId) {
      toast.error("Missing user or athlete ID");
      return;
    }
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          city: city || null,
          state: state || null,
          country
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Calculate height
      const totalHeightInches = heightFeet && heightInches
        ? parseInt(heightFeet) * 12 + parseInt(heightInches)
        : null;

      // Validate and format username
      const formattedUsername = username
        ? username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : undefined;

      // Update athlete
      const { error: athleteError } = await supabase
        .from("athletes")
        .update({
          username: formattedUsername,
          nickname: nickname || null,
          sport,
          secondary_sports: secondarySports.length > 0 ? secondarySports : null,
          position: position || null,
          height_in: totalHeightInches,
          weight_lb: weight ? parseFloat(weight) : null,
          jersey_number: jerseyNumber || null,
          filled_out_by: filledOutBy || null,
          high_school: highSchool || null,
          club_team_name: clubTeam || null,
          graduation_year: gradYear ? parseInt(gradYear) : null,
          gpa: gpa ? parseFloat(gpa) : null,
          sat_score: satScore ? parseInt(satScore) : null,
          act_score: actScore ? parseInt(actScore) : null,
          ncaa_eligibility_number: ncaaNumber || null,
          academic_achievements: academicAchievements || null,
          favorite_subject: favoriteSubject || null,
          has_honors_ap_ib: hasHonors,
          honors_courses: honorsCourses || null,
          legal_situations: legalSituations,
          legal_situations_explanation: legalExplanation || null,
          forty_yard_dash: fortyYard ? parseFloat(fortyYard) : null,
          vertical_jump: verticalJump ? parseFloat(verticalJump) : null,
          bench_press_max: benchPress ? parseInt(benchPress) : null,
          squat_max: squat ? parseInt(squat) : null,
          athletic_awards: athleticAwards.length > 0 ? athleticAwards : null,
          leadership_roles: leadershipRoles || null,
          notable_performances: notablePerformances || null,
          being_recruited: beingRecruited,
          recruiting_schools: recruitingSchools.length > 0 ? recruitingSchools : null,
          received_offers: receivedOffers,
          offer_schools: offerSchools.length > 0 ? offerSchools : null,
          committed,
          committed_school: committedSchool || null,
          camps_attended: campsAttended.length > 0 ? campsAttended : null,
          upcoming_camps: upcomingCamps.length > 0 ? upcomingCamps : null,
          twitter_handle: twitterHandle || null,
          instagram_handle: instagramHandle || null,
          tiktok_handle: tiktokHandle || null,
          personal_description: personalDescription || null,
          five_year_goals: fiveYearGoals || null,
          motivation: motivation || null,
          challenges_overcome: challenges || null,
          role_model: roleModel || null,
          community_involvement: communityInvolvement || null,
          message_to_coaches: messageToCoaches || null,
          highlights_url: highlightsUrl || null,
          bio: bio || null,
        })
        .eq("id", athleteId);

      if (athleteError) throw athleteError;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={logoIcon} alt="ForSWAGs" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground">Provide comprehensive information for college recruiters</p>
        </div>

        <Accordion type="multiple" defaultValue={["personal", "athletic"]} className="space-y-4">
          {/* Personal Information */}
          <AccordionItem value="personal">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Nickname / Preferred Name</Label>
                      <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Profile Username *</Label>
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="john-smith"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your public profile URL: forswags.com/athlete/{username || 'your-username'}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Who is filling this out?</Label>
                    <Select value={filledOutBy} onValueChange={setFilledOutBy}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">Athlete</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Athletic Information */}
          <AccordionItem value="athletic">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Athletic Information
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Sport *</Label>
                      <Select value={sport} onValueChange={setSport}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Primary Position</Label>
                      <Input value={position} onChange={(e) => setPosition(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>High School</Label>
                      <Input value={highSchool} onChange={(e) => setHighSchool(e.target.value)} />
                    </div>
                    <div>
                      <Label>Club/AAU Team</Label>
                      <Input value={clubTeam} onChange={(e) => setClubTeam(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Jersey Number</Label>
                      <Input value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label>Height (Feet)</Label>
                      <Input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} />
                    </div>
                    <div>
                      <Label>Height (Inches)</Label>
                      <Input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Weight (lbs)</Label>
                      <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                    </div>
                    <div>
                      <Label>Graduation Year</Label>
                      <Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Academic Information */}
          <AccordionItem value="academic">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>GPA</Label>
                      <Input type="number" step="0.01" value={gpa} onChange={(e) => setGpa(e.target.value)} />
                    </div>
                    <div>
                      <Label>SAT Score</Label>
                      <Input type="number" value={satScore} onChange={(e) => setSatScore(e.target.value)} />
                    </div>
                    <div>
                      <Label>ACT Score</Label>
                      <Input type="number" value={actScore} onChange={(e) => setActScore(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>NCAA Eligibility Number</Label>
                    <Input value={ncaaNumber} onChange={(e) => setNcaaNumber(e.target.value)} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox checked={hasHonors} onCheckedChange={(checked) => setHasHonors(checked as boolean)} />
                    <Label>Taking Honors, AP, or IB courses?</Label>
                  </div>

                  {hasHonors && (
                    <div>
                      <Label>List Honors/AP/IB Courses</Label>
                      <Textarea value={honorsCourses} onChange={(e) => setHonorsCourses(e.target.value)} />
                    </div>
                  )}

                  <div>
                    <Label>Academic Achievements/Awards</Label>
                    <Textarea value={academicAchievements} onChange={(e) => setAcademicAchievements(e.target.value)} />
                  </div>

                  <div>
                    <Label>Favorite Academic Subject</Label>
                    <Input value={favoriteSubject} onChange={(e) => setFavoriteSubject(e.target.value)} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox checked={legalSituations} onCheckedChange={(checked) => setLegalSituations(checked as boolean)} />
                    <Label>Any legal situations or suspensions?</Label>
                  </div>

                  {legalSituations && (
                    <div>
                      <Label>Please Explain</Label>
                      <Textarea value={legalExplanation} onChange={(e) => setLegalExplanation(e.target.value)} />
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Performance Metrics */}
          <AccordionItem value="performance">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Athletic Performance & Stats
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label>40-Yard Dash (seconds)</Label>
                      <Input type="number" step="0.01" value={fortyYard} onChange={(e) => setFortyYard(e.target.value)} />
                    </div>
                    <div>
                      <Label>Vertical Jump (inches)</Label>
                      <Input type="number" step="0.1" value={verticalJump} onChange={(e) => setVerticalJump(e.target.value)} />
                    </div>
                    <div>
                      <Label>Bench Press Max (lbs)</Label>
                      <Input type="number" value={benchPress} onChange={(e) => setBenchPress(e.target.value)} />
                    </div>
                    <div>
                      <Label>Squat Max (lbs)</Label>
                      <Input type="number" value={squat} onChange={(e) => setSquat(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Athletic Awards/Honors</Label>
                    <Textarea
                      value={athleticAwards.join("\n")}
                      onChange={(e) => setAthleticAwards(e.target.value.split("\n").filter(Boolean))}
                      placeholder="Enter each award on a new line"
                    />
                  </div>

                  <div>
                    <Label>Leadership Roles/Captain Positions</Label>
                    <Textarea value={leadershipRoles} onChange={(e) => setLeadershipRoles(e.target.value)} />
                  </div>

                  <div>
                    <Label>Notable Games/Performances</Label>
                    <Textarea value={notablePerformances} onChange={(e) => setNotablePerformances(e.target.value)} />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Recruiting & Exposure */}
          <AccordionItem value="recruiting">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recruiting & Exposure
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={beingRecruited} onCheckedChange={(checked) => setBeingRecruited(checked as boolean)} />
                    <Label>Currently being recruited by colleges?</Label>
                  </div>

                  {beingRecruited && (
                    <div>
                      <Label>Schools Contacting You</Label>
                      <Textarea
                        value={recruitingSchools.join("\n")}
                        onChange={(e) => setRecruitingSchools(e.target.value.split("\n").filter(Boolean))}
                        placeholder="Enter each school on a new line"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox checked={receivedOffers} onCheckedChange={(checked) => setReceivedOffers(checked as boolean)} />
                    <Label>Received offers from colleges?</Label>
                  </div>

                  {receivedOffers && (
                    <div>
                      <Label>Schools That Offered</Label>
                      <Textarea
                        value={offerSchools.join("\n")}
                        onChange={(e) => setOfferSchools(e.target.value.split("\n").filter(Boolean))}
                        placeholder="Enter each school on a new line"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox checked={committed} onCheckedChange={(checked) => setCommitted(checked as boolean)} />
                    <Label>Committed to a school?</Label>
                  </div>

                  {committed && (
                    <div>
                      <Label>Committed School</Label>
                      <Input value={committedSchool} onChange={(e) => setCommittedSchool(e.target.value)} />
                    </div>
                  )}

                  <div>
                    <Label>Camps/Showcases Attended</Label>
                    <Textarea
                      value={campsAttended.join("\n")}
                      onChange={(e) => setCampsAttended(e.target.value.split("\n").filter(Boolean))}
                      placeholder="Enter each camp on a new line"
                    />
                  </div>

                  <div>
                    <Label>Upcoming Camps/Showcases</Label>
                    <Textarea
                      value={upcomingCamps.join("\n")}
                      onChange={(e) => setUpcomingCamps(e.target.value.split("\n").filter(Boolean))}
                      placeholder="Enter each camp on a new line"
                    />
                  </div>

                  <div>
                    <Label>Highlight Video URL</Label>
                    <Input type="url" value={highlightsUrl} onChange={(e) => setHighlightsUrl(e.target.value)} placeholder="YouTube, Hudl, etc." />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Social Media */}
          <AccordionItem value="social">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Social Media & Branding
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <Label>Twitter/X Handle</Label>
                    <Input value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="@username" />
                  </div>
                  <div>
                    <Label>Instagram Handle</Label>
                    <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@username" />
                  </div>
                  <div>
                    <Label>TikTok Handle</Label>
                    <Input value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="@username" />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Personal Development */}
          <AccordionItem value="personal-dev">
            <Card>
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Personal & Character Development
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <Label>Describe yourself in three words</Label>
                    <Input value={personalDescription} onChange={(e) => setPersonalDescription(e.target.value)} />
                  </div>

                  <div>
                    <Label>What are your goals for the next five years?</Label>
                    <Textarea value={fiveYearGoals} onChange={(e) => setFiveYearGoals(e.target.value)} />
                  </div>

                  <div>
                    <Label>What motivates you to be an athlete?</Label>
                    <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} />
                  </div>

                  <div>
                    <Label>What challenges have you overcome in your athletic career?</Label>
                    <Textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} />
                  </div>

                  <div>
                    <Label>Who is your biggest role model, and why?</Label>
                    <Textarea value={roleModel} onChange={(e) => setRoleModel(e.target.value)} />
                  </div>

                  <div>
                    <Label>How do you give back to your community?</Label>
                    <Textarea value={communityInvolvement} onChange={(e) => setCommunityInvolvement(e.target.value)} />
                  </div>

                  <div>
                    <Label>What is one thing you want college coaches to know about you?</Label>
                    <Textarea value={messageToCoaches} onChange={(e) => setMessageToCoaches(e.target.value)} />
                  </div>

                  <div>
                    <Label>Bio / Personal Statement</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        {/* Profile Sharing Actions */}
        {athleteId && (
          <ProfileActions 
            athleteId={athleteId}
            athleteName={fullName}
            athleteUsername={username}
          />
        )}

        <div className="mt-8 flex gap-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Profile</>}
          </Button>
        </div>
      </main>
    </div>
  );
}