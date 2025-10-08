import React from "react";
import logoFull from "@/assets/forswags-logo.png";

export const Footer = React.memo(() => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6">
          <a href="/">
            <img src={logoFull} alt="ForSWAGs" className="h-20 mx-auto" />
          </a>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground leading-relaxed border-l-4 border-secondary pl-4 text-left">
              ForSWAGs is an athletic development and college matching platform. 
              We are not recruiters and do not guarantee college placement or scholarships. 
              Results depend on individual effort, performance, and external factors beyond our control.
            </p>
          </div>
          
          <div className="flex justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <a href="/sponsors" className="hover:text-primary transition-colors">Sponsors</a>
            <a href="/sponsor-showcase" className="hover:text-primary transition-colors">Our Sponsors</a>
            <a href="/about" className="hover:text-primary transition-colors">About Us</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          
          <div className="border-t border-border pt-6 space-y-3">
            <p className="text-xs text-muted-foreground/80 max-w-4xl mx-auto leading-relaxed">
              © 2019 ForSWAGs™ (For Students With Athletic Goals). All Rights Reserved Worldwide.
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-4xl mx-auto leading-relaxed">
              ForSWAGs®, the ForSWAGs logo, Playbook for Life®, and all associated trademarks, service marks, 
              trade names, proprietary methodologies, evaluation systems, ranking algorithms, college matching technology, 
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
