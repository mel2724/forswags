import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

// Eager load critical pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages for code splitting
const Sponsors = lazy(() => import("./pages/Sponsors"));
const SponsorShowcase = lazy(() => import("./pages/SponsorShowcase"));
const SchoolSearch = lazy(() => import("./pages/SchoolSearch"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Players = lazy(() => import("./pages/Players"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileComprehensive = lazy(() => import("./pages/ProfileComprehensive"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PrimeDime = lazy(() => import("./pages/PrimeDime"));
const OfferTracker = lazy(() => import("./pages/OfferTracker"));
const StatsManager = lazy(() => import("./pages/StatsManager"));
const CollegePreferences = lazy(() => import("./pages/CollegePreferences"));
const CollegeMatching = lazy(() => import("./pages/CollegeMatching"));
const AlumniNetwork = lazy(() => import("./pages/AlumniNetwork"));
const MediaGallery = lazy(() => import("./pages/MediaGallery"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Courses = lazy(() => import("./pages/Courses"));
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
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMemberships = lazy(() => import("./pages/admin/AdminMemberships"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminAthletes = lazy(() => import("./pages/admin/AdminAthletes"));
const AdminSchools = lazy(() => import("./pages/admin/AdminSchools"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminCoachApplications = lazy(() => import("./pages/admin/AdminCoachApplications"));
const AdminRankings = lazy(() => import("./pages/admin/AdminRankings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminEvaluations = lazy(() => import("./pages/admin/AdminEvaluations"));
const AdminSponsors = lazy(() => import("./pages/admin/AdminSponsors"));
const AdminPayPalSetup = lazy(() => import("./pages/admin/AdminPayPalSetup"));
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
const Contact = lazy(() => import("./pages/Contact"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/athlete/:username" element={<PublicProfile />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/sponsor-showcase" element={<SponsorShowcase />} />
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
            <Route path="/alumni-network" element={<AlumniNetwork />} />
            <Route path="/media" element={<MediaGallery />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/schools" element={<SchoolSearch />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<Lesson />} />
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
              <Route path="users" element={<AdminUsers />} />
              <Route path="memberships" element={<AdminMemberships />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="athletes" element={<AdminAthletes />} />
              <Route path="rankings" element={<AdminRankings />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="coach-applications" element={<AdminCoachApplications />} />
              <Route path="email-templates" element={<AdminEmailTemplates />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="evaluations" element={<AdminEvaluations />} />
              <Route path="sponsors" element={<AdminSponsors />} />
              <Route path="paypal-setup" element={<AdminPayPalSetup />} />
            </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
