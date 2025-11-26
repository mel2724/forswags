import { Button } from "@/components/ui/button";
import logoFull from "@/assets/forswags-logo.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <img src={logoFull} alt="ForSWAGs" className="h-12" />
        </div>
      </div>
    </header>
  );
}
