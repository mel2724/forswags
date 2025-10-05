import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  startImpersonation: (userId: string, userEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  getEffectiveUserId: () => string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load impersonation state from database on mount
    checkImpersonation();
  }, []);

  const checkImpersonation = async () => {
    try {
      const { data, error } = await supabase.rpc('get_impersonated_user_id');
      
      if (error) throw error;
      
      if (data) {
        // Get user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', data)
          .single();
        
        setImpersonatedUserId(data);
        setImpersonatedUserEmail(profile?.email || null);
      }
    } catch (error) {
      console.error('Error checking impersonation:', error);
    }
  };

  const startImpersonation = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.rpc('start_impersonation_session', {
        p_impersonated_user_id: userId
      });

      if (error) throw error;

      setImpersonatedUserId(userId);
      setImpersonatedUserEmail(userEmail);
      toast.success(`Now impersonating ${userEmail}`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      toast.error(error.message || 'Failed to start impersonation');
    }
  };

  const stopImpersonation = async () => {
    try {
      const { error } = await supabase.rpc('end_impersonation_session');

      if (error) throw error;

      setImpersonatedUserId(null);
      setImpersonatedUserEmail(null);
      toast.success('Impersonation ended');
      navigate("/admin");
    } catch (error: any) {
      console.error('Error stopping impersonation:', error);
      toast.error(error.message || 'Failed to stop impersonation');
    }
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
