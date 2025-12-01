import { Construction, Zap } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Logo */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img 
            src="/forswags-logo.png" 
            alt="ForSWAGs" 
            className="h-20 md:h-28 mx-auto mb-8"
          />
        </div>

        {/* Construction Icon */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="inline-flex p-6 bg-primary/10 rounded-full mb-6">
            <Construction className="h-16 w-16 md:h-20 md:h-20 text-primary animate-pulse" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <span className="text-gradient-primary">LEVELING UP</span>
          <br />
          OUR GAME
        </h1>

        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450 font-medium">
          We're making some exciting improvements to bring you an even better experience
        </p>

        {/* Status Message */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur border-2 border-primary/20 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
          <Zap className="h-5 w-5 text-secondary animate-pulse" />
          <span className="text-sm md:text-base font-bold uppercase tracking-wide">
            Site updates in progress
          </span>
        </div>

        {/* Additional Info */}
        <p className="mt-12 text-sm text-muted-foreground animate-in fade-in duration-700 delay-750">
          We'll be back shortly. Thank you for your patience!
        </p>
      </div>
    </div>
  );
}
