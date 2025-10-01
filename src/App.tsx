import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Profile from "./pages/Profile";
import ProfileComprehensive from "./pages/ProfileComprehensive";
import PrimeDime from "./pages/PrimeDime";
import OfferTracker from "./pages/OfferTracker";
import StatsManager from "./pages/StatsManager";
import CollegePreferences from "./pages/CollegePreferences";
import MediaGallery from "./pages/MediaGallery";
import Rankings from "./pages/Rankings";
import Notifications from "./pages/Notifications";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Lesson from "./pages/Lesson";
import Badges from "./pages/Badges";
import Evaluations from "./pages/Evaluations";
import SocialMedia from "./pages/SocialMedia";
import Membership from "./pages/Membership";
import MembershipAthlete from "./pages/MembershipAthlete";
import MembershipRecruiter from "./pages/MembershipRecruiter";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import AthleteSearch from "./pages/recruiter/AthleteSearch";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";
import ParentDashboard from "./pages/ParentDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMemberships from "./pages/admin/AdminMemberships";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminAthletes from "./pages/admin/AdminAthletes";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminCoachApplications from "./pages/admin/AdminCoachApplications";
import CoachApplication from "./pages/CoachApplication";
import CoachDashboard from "./pages/coach/CoachDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ImpersonationProvider>
          <ImpersonationBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
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
            <Route path="/media" element={<MediaGallery />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<Lesson />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/membership/athlete" element={<MembershipAthlete />} />
          <Route path="/membership/recruiter" element={<MembershipRecruiter />} />
            <Route path="/social" element={<SocialMedia />} />
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/search" element={<AthleteSearch />} />
            <Route path="/recruiter/profile" element={<RecruiterProfile />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/coach/apply" element={<CoachApplication />} />
            <Route path="/coach/dashboard" element={<CoachDashboard />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="memberships" element={<AdminMemberships />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="athletes" element={<AdminAthletes />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="coach-applications" element={<AdminCoachApplications />} />
              <Route path="email-templates" element={<AdminEmailTemplates />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ImpersonationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
