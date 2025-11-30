import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    } else if (showOfflineAlert) {
      // Was offline, now online
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
      
      // Hide online alert after 3 seconds
      const timer = setTimeout(() => {
        setShowOnlineAlert(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineAlert]);

  if (!showOfflineAlert && !showOnlineAlert) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-2">
      {showOfflineAlert && (
        <Alert variant="destructive" className="border-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="font-medium">
            You're offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      {showOnlineAlert && (
        <Alert className="border-2 border-primary bg-primary/10">
          <Wifi className="h-4 w-4 text-primary" />
          <AlertDescription className="font-medium text-primary">
            Back online! All features restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
