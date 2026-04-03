import { createContext, useContext, useState, ReactNode } from "react";

interface Corretora {
  id: string;
  nome: string;
  plano: string;
  status: string;
}

interface ImpersonationContextType {
  impersonating: boolean;
  corretora: Corretora | null;
  startImpersonation: (corretora: Corretora) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonating: false,
  corretora: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

export const useImpersonation = () => useContext(ImpersonationContext);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [corretora, setCorretora] = useState<Corretora | null>(null);

  const startImpersonation = (c: Corretora) => setCorretora(c);
  const stopImpersonation = () => setCorretora(null);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating: !!corretora,
        corretora,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}
