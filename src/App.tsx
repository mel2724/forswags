import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Profile from "./pages/Profile";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/profile" element={<Profile />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
