import logoFull from "@/assets/forswags-logo.png";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6">
          <Link to="/">
            <img src={logoFull} alt="ForSWAGs" className="h-20 mx-auto" />
          </Link>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground leading-relaxed border-l-4 border-secondary pl-4 text-left">
              ForSWAGs is an athletic development and college matching platform. 
              We are not recruiters and do not guarantee college placement or scholarships. 
              Results depend on individual effort, performance, and external factors beyond our control.
            </p>
          </div>
          
          <div className="flex justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <Link to="/sponsors" className="hover:text-primary transition-colors">Sponsors</Link>
            <Link to="/sponsor-showcase" className="hover:text-primary transition-colors">Our Sponsors</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            © 2025 ForSWAGs · For Students With Athletic Goals
          </p>
        </div>
      </div>
    </footer>
  );
}
