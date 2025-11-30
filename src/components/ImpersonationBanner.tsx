import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserX, AlertCircle } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUserEmail, stopImpersonation } = useImpersonation();

  if (!isImpersonating) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 border-b-4 border-b-yellow-500 bg-yellow-50 text-yellow-900">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="font-semibold">
          You are viewing as: <span className="font-mono">{impersonatedUserEmail}</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={stopImpersonation}
          className="ml-4"
        >
          <UserX className="h-4 w-4 mr-2" />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
}
