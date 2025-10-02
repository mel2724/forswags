import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useServiceWorker } from "@/hooks/usePWA";

export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-secondary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-secondary" />
            Update Available
          </CardTitle>
          <CardDescription>
            A new version of ForSWAGs is ready to install
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={updateServiceWorker} className="w-full" variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
