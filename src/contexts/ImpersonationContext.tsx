import { createContext, useContext, ReactNode } from "react";

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  startImpersonation: (userId: string, userEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  getEffectiveUserId: () => string | null;
}

// Default safe values for when provider is not available
const defaultContext: ImpersonationContextType = {
  impersonatedUserId: null,
  impersonatedUserEmail: null,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
  isImpersonating: false,
  getEffectiveUserId: () => null,
};

const ImpersonationContext = createContext<ImpersonationContextType>(defaultContext);

// Simplified provider that doesn't use hooks - prevents HMR crashes
// Last updated: 2025-10-07 - Stability fix
export function ImpersonationProvider({ children }: { children: ReactNode }) {
  return (
    <ImpersonationContext.Provider value={defaultContext}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  return context || defaultContext;
}
