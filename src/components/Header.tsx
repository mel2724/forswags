import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logoFull} alt="ForSWAGs" className="h-12" />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <a href="/#features" className="px-4 py-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                  Features
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a href="/#pricing" className="px-4 py-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                  Pricing
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-bold">
                  Discover
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/about"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-bold leading-none">About</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Learn more about ForSWAGs and our mission
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/players"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-bold leading-none">Athletes</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse our athlete directory
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/for-recruiters"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-bold leading-none">For Recruiters</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Tools and resources for college recruiters
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/sponsors"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-bold leading-none">Sponsors</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View our sponsors and partners
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Button onClick={() => navigate("/auth")} className="btn-hero ml-2">
            Sign Up
          </Button>
        </nav>

        <Button 
          className="md:hidden btn-hero" 
          onClick={() => navigate("/auth")}
        >
          Sign Up
        </Button>
      </div>
    </header>
  );
}
