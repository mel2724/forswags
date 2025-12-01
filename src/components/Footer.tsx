import forswagsLogo from '../assets/forswags-logo.png';
import React from "react";
import logoFull from "@/assets/forswags-logo.png";

interface FooterProps {
  hideNavigation?: boolean;
}

export const Footer = React.memo(({ hideNavigation = false }: FooterProps) => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6">
          <div><img
  src={forswagsLogo}
  alt="ForSWAGs"
  className="h-20 mx-auto"
/>
/>
          </div>
          
          {!hideNavigation && (
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
            </nav>
          )}
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              ForSWAGs is an athletic development and college scouting promotion platform. 
              We are not college scouts and do not guarantee college placement or scholarships. 
              Results depend on individual effort, performance, and external factors beyond our control.
            </p>
          </div>
          
          <div className="border-t border-border pt-6 space-y-3">
            <p className="text-xs text-muted-foreground/80 max-w-4xl mx-auto leading-relaxed">
              © 2019 ForSWAGs™ (For Students With Athletic Goals). All Rights Reserved Worldwide.
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-4xl mx-auto leading-relaxed">
              ForSWAGs®, the ForSWAGs logo, Playbook for Life®, and all associated trademarks, service marks, 
              trade names, proprietary methodologies, evaluation systems, ranking algorithms, The "Prime Dime" matching technology, 
              and platform features are the exclusive intellectual property of ForSWAGs and are protected by U.S. and 
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-4xl mx-auto">
              Unauthorized reproduction, distribution, modification, reverse engineering, or commercial exploitation 
              of any ForSWAGs content, technology, methodology, or platform features is strictly prohibited and may 
              result in severe civil and criminal penalties.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
