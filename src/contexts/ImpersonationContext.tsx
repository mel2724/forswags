// Stub context - Impersonation feature disabled for stability
// DO NOT ADD REACT HOOKS TO THIS FILE
import { createContext, useContext, ReactNode } from "react";

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  startImpersonation: (userId: string, userEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  getEffectiveUserId: () => string | null;
}

const STUB_CONTEXT: ImpersonationContextType = {
  impersonatedUserId: null,
  impersonatedUserEmail: null,
  startImpersonation: async () => { console.log('Impersonation disabled'); },
  stopImpersonation: async () => { console.log('Impersonation disabled'); },
  isImpersonating: false,
  getEffectiveUserId: () => null,
};

const ImpersonationContext = createContext<ImpersonationContextType>(STUB_CONTEXT);

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => (
  <ImpersonationContext.Provider value={STUB_CONTEXT}>
    {children}
  </ImpersonationContext.Provider>
);

export const useImpersonation = () => useContext(ImpersonationContext) || STUB_CONTEXT;
