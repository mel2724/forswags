// Main Application Entry Point - v11
import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BadgeNotificationProvider } from "@/contexts/BadgeNotificationContext";
import { initLocalStorageCleanup } from "@/lib/localStorageCleanup";

// Lazy load admin pages
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const ClaimProfile = lazy(() => import("./pages/ClaimProfile"));
const ParentVerification = lazy(() => import("./pages/ParentVerification"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const ForRecruiters = lazy(() => import("./pages/ForRecruiters"));
const Sponsors = lazy(() => import("./pages/Sponsors"));
const SponsorShowcase = lazy(() => import("./pages/SponsorShowcase"));
const SchoolSearch = lazy(() => import("./pages/SchoolSearch"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Players = lazy(() => import("./pages/Players"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileComprehensive = lazy(() => import("./pages/ProfileComprehensive"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PrimeDime = lazy(() => import("./pages/PrimeDime"));
const CollegeFit = lazy(() => import("./pages/CollegeFit"));
const OfferTracker = lazy(() => import("./pages/OfferTracker"));
const StatsManager = lazy(() => import("./pages/StatsManager"));
const CollegePreferences = lazy(() => import("./pages/CollegePreferences"));
const CollegeMatching = lazy(() => import("./pages/CollegeMatching"));
const AlumniNetwork = lazy(() => import("./pages/AlumniNetwork"));
const AlumniDashboard = lazy(() => import("./pages/AlumniDashboard"));
const MediaGallery = lazy(() => import("./pages/MediaGallery"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PlaybookForLife = lazy(() => import("./pages/PlaybookForLife"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Lesson = lazy(() => import("./pages/Lesson"));
const Badges = lazy(() => import("./pages/Badges"));
const Evaluations = lazy(() => import("./pages/Evaluations"));
const EvaluationProgress = lazy(() => import("./pages/EvaluationProgress"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const Membership = lazy(() => import("./pages/Membership"));
const MembershipAthlete = lazy(() => import("./pages/MembershipAthlete"));
const MembershipRecruiter = lazy(() => import("./pages/MembershipRecruiter"));
const RecruiterDashboard = lazy(() => import("./pages/recruiter/RecruiterDashboard"));
const AthleteSearch = lazy(() => import("./pages/recruiter/AthleteSearch"));
const RecruiterProfile = lazy(() => import("./pages/recruiter/RecruiterProfile"));
const RecruiterAnalyticsPage = lazy(() => import("./pages/recruiter/RecruiterAnalyticsPage"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMemberships = lazy(() => import("./pages/admin/AdminMemberships"));
const AdminLearning = lazy(() => import("./pages/admin/AdminLearning"));
const AdminPlaybookQuizzes = lazy(() => import("./pages/admin/AdminPlaybookQuizzes"));
const AdminCourseDetail = lazy(() => import("./pages/admin/AdminCourseDetail"));
const AdminAthletes = lazy(() => import("./pages/admin/AdminAthletes"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminCoachApplications = lazy(() => import("./pages/admin/AdminCoachApplications"));
const AdminCoaches = lazy(() => import("./pages/admin/AdminCoaches"));
const AdminScheduledEmails = lazy(() => import("./pages/admin/AdminScheduledEmails"));
const AdminRankings = lazy(() => import("./pages/admin/AdminRankings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminEvaluations = lazy(() => import("./pages/admin/AdminEvaluations"));
const AdminSponsors = lazy(() => import("./pages/admin/AdminSponsors"));
const AdminPayPalSetup = lazy(() => import("./pages/admin/AdminPayPalSetup"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminRefunds = lazy(() => import("./pages/admin/AdminRefunds"));
const AdminConsentMonitoring = lazy(() => import("./pages/admin/AdminConsentMonitoring"));
const AdminArchivedMedia = lazy(() => import("./pages/admin/AdminArchivedMedia"));
const AdminImportAthletes = lazy(() => import("./pages/admin/AdminImportAthletes"));
const AdminAthletePromo = lazy(() => import("./pages/admin/AdminAthletePromo"));
const AdminChatbot = lazy(() => import("./pages/admin/AdminChatbot"));
const AdminAIUsage = lazy(() => import("./pages/admin/AdminAIUsage"));
const AdminSecretRotation = lazy(() => import("./pages/admin/AdminSecretRotation"));
const AdminEvaluationPayments = lazy(() => import("./pages/admin/AdminEvaluationPayments"));
const AdminScrapingHistory = lazy(() => import("./pages/admin/AdminScrapingHistory"));
const CoachApplication = lazy(() => import("./pages/CoachApplication"));
const PurchaseEvaluation = lazy(() => import("./pages/PurchaseEvaluation"));
const CoachDashboard = lazy(() => import("./pages/coach/CoachDashboard"));
const CoachProfile = lazy(() => import("./pages/coach/CoachProfile"));
const CoachProfileView = lazy(() => import("./pages/coach/CoachProfileView"));
const CoachDirectory = lazy(() => import("./pages/coach/CoachDirectory"));
const AvailableEvaluations = lazy(() => import("./pages/coach/AvailableEvaluations"));
const EvaluationDetail = lazy(() => import("./pages/coach/EvaluationDetail"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Optimized React Query client with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main Application Component
// Build: FORCED-REBUILD-v9-CACHE-CLEAR
const App = () => {
  // Initialize localStorage cleanup service on app mount
  useEffect(() => {
    const cleanup = initLocalStorageCleanup();
    
    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BadgeNotificationProvider>
          <BrowserRouter>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/athlete/:username" element={<PublicProfile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/claim/:token" element={<ClaimProfile />} />
              <Route path="/parent-verify" element={<ParentVerification />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/sponsor-showcase" element={<SponsorShowcase />} />
              <Route path="/for-recruiters" element={<ForRecruiters />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/complete" element={<ProfileComprehensive />} />
              <Route path="/prime-dime" element={<PrimeDime />} />
              <Route path="/offers" element={<OfferTracker />} />
              <Route path="/stats" element={<StatsManager />} />
              <Route path="/preferences" element={<CollegePreferences />} />
              <Route path="/college-matches" element={<CollegeMatching />} />
              <Route path="/college-fit" element={<CollegeFit />} />
              <Route path="/alumni-network" element={<AlumniNetwork />} />
              <Route path="/alumni/dashboard" element={<AlumniDashboard />} />
              <Route path="/media" element={<MediaGallery />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/schools" element={<SchoolSearch />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/learning" element={<PlaybookForLife />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/lessons/:lessonId" element={<Lesson />} />
              {/* Redirects for old routes */}
              <Route path="/courses" element={<PlaybookForLife />} />
              <Route path="/playbook-for-life" element={<PlaybookForLife />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/evaluations" element={<Evaluations />} />
              <Route path="/evaluations/purchase" element={<PurchaseEvaluation />} />
              <Route path="/evaluations/progress" element={<EvaluationProgress />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/membership/athlete" element={<MembershipAthlete />} />
              <Route path="/membership/recruiter" element={<MembershipRecruiter />} />
              <Route path="/social" element={<SocialMedia />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/search" element={<AthleteSearch />} />
              <Route path="/recruiter/profile" element={<RecruiterProfile />} />
              <Route path="/recruiter/analytics" element={<RecruiterAnalyticsPage />} />
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/coach/apply" element={<CoachApplication />} />
              <Route path="/coach/dashboard" element={<CoachDashboard />} />
              <Route path="/coach/profile" element={<CoachProfile />} />
              <Route path="/coach/view/:id" element={<CoachProfileView />} />
              <Route path="/coaches" element={<CoachDirectory />} />
              <Route path="/coach/available" element={<AvailableEvaluations />} />
              <Route path="/coach/evaluation/:id" element={<EvaluationDetail />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="memberships" element={<AdminMemberships />} />
                <Route path="learning" element={<AdminLearning />} />
                <Route path="playbook-quizzes" element={<AdminPlaybookQuizzes />} />
                <Route path="courses/:courseId" element={<AdminCourseDetail />} />
                {/* Redirects for old admin routes */}
                <Route path="courses" element={<AdminLearning />} />
                <Route path="playbook-dashboard" element={<AdminLearning />} />
                <Route path="playbook-videos" element={<AdminLearning />} />
                <Route path="athletes" element={<AdminAthletes />} />
                <Route path="rankings" element={<AdminRankings />} />
                <Route path="coach-applications" element={<AdminCoachApplications />} />
                <Route path="coaches" element={<AdminCoaches />} />
                <Route path="scheduled-emails" element={<AdminScheduledEmails />} />
                <Route path="email-templates" element={<AdminEmailTemplates />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="evaluations" element={<AdminEvaluations />} />
                <Route path="sponsors" element={<AdminSponsors />} />
                <Route path="promo-codes" element={<AdminPromoCodes />} />
                <Route path="refunds" element={<AdminRefunds />} />
                <Route path="paypal-setup" element={<AdminPayPalSetup />} />
                <Route path="consent-monitoring" element={<AdminConsentMonitoring />} />
                <Route path="archived-media" element={<AdminArchivedMedia />} />
                <Route path="import-athletes" element={<AdminImportAthletes />} />
                <Route path="athlete-promo" element={<AdminAthletePromo />} />
                <Route path="chatbot" element={<AdminChatbot />} />
                <Route path="ai-usage" element={<AdminAIUsage />} />
                <Route path="secret-rotation" element={<AdminSecretRotation />} />
                <Route path="evaluation-payments" element={<AdminEvaluationPayments />} />
                <Route path="scraping-history" element={<AdminScrapingHistory />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </BadgeNotificationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
