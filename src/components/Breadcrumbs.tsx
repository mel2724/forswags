import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "Profile",
  stats: "Stats",
  evaluations: "Evaluations",
  courses: "Courses",
  lessons: "Lesson",
  badges: "Badges",
  rankings: "Rankings",
  offers: "Offers",
  media: "Media Gallery",
  social: "Social Media",
  preferences: "Preferences",
  membership: "Membership",
  notifications: "Notifications",
  admin: "Admin",
  users: "Users",
  athletes: "Athletes",
  schools: "Schools",
  sponsors: "Sponsors",
  coach: "Coach",
  recruiter: "College Scout",
  parent: "Parent",
  search: "Search",
  available: "Available",
  complete: "Complete",
  purchase: "Purchase",
  apply: "Apply",
  "coach-applications": "Applications",
  "email-templates": "Email Templates",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0 || location.pathname === "/") {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const name = routeNameMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

          return (
            <BreadcrumbItem key={routeTo}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              {isLast ? (
                <BreadcrumbPage>{name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={routeTo}>{name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
