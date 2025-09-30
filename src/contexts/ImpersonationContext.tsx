import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  startImpersonation: (userId: string, userEmail: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  getEffectiveUserId: () => string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load impersonation state from sessionStorage on mount
    const storedUserId = sessionStorage.getItem("impersonated_user_id");
    const storedUserEmail = sessionStorage.getItem("impersonated_user_email");
    
    if (storedUserId && storedUserEmail) {
      setImpersonatedUserId(storedUserId);
      setImpersonatedUserEmail(storedUserEmail);
    }
  }, []);

  const startImpersonation = (userId: string, userEmail: string) => {
    sessionStorage.setItem("impersonated_user_id", userId);
    sessionStorage.setItem("impersonated_user_email", userEmail);
    setImpersonatedUserId(userId);
    setImpersonatedUserEmail(userEmail);
    navigate("/dashboard");
  };

  const stopImpersonation = () => {
    sessionStorage.removeItem("impersonated_user_id");
    sessionStorage.removeItem("impersonated_user_email");
    setImpersonatedUserId(null);
    setImpersonatedUserEmail(null);
    navigate("/admin");
  };

  const getEffectiveUserId = () => {
    if (impersonatedUserId) {
      return impersonatedUserId;
    }
    return null;
  };

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedUserId,
        impersonatedUserEmail,
        startImpersonation,
        stopImpersonation,
        isImpersonating: !!impersonatedUserId,
        getEffectiveUserId,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}
