import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const [onboardingCheck, setOnboardingCheck] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== "admin_corretora" || !profile.corretora_id || location.pathname === "/onboarding") {
      setOnboardingCheck(false);
      return;
    }

    setChecking(true);
    supabase
      .from("corretoras")
      .select("onboarding_completo")
      .eq("id", profile.corretora_id)
      .single()
      .then(({ data }) => {
        setOnboardingCheck(data ? !data.onboarding_completo : false);
        setChecking(false);
      });
  }, [profile, location.pathname]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (onboardingCheck) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
