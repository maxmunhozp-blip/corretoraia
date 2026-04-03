import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  nome: string;
  cargo: string | null;
  avatar_iniciais: string | null;
  role: string;
  corretora_id: string | null;
}

interface CorretoraTheme {
  cor_primaria: string | null;
  cor_secundaria: string | null;
  nome: string;
  logo_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  corretoraTheme: CorretoraTheme | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  corretoraTheme: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeColors(theme: CorretoraTheme | null) {
  const root = document.documentElement;
  if (!theme?.cor_primaria) {
    // Reset to defaults
    root.style.removeProperty('--primary');
    root.style.removeProperty('--brand');
    root.style.removeProperty('--brand-hover');
    root.style.removeProperty('--brand-light');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--sidebar-primary');
    root.style.removeProperty('--sidebar-accent');
    return;
  }

  const primaryHsl = hexToHsl(theme.cor_primaria);
  if (!primaryHsl) return;

  const [h, s] = primaryHsl.split(' ');
  const hNum = parseInt(h);
  const sNum = parseInt(s);

  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--brand', primaryHsl);
  root.style.setProperty('--brand-hover', `${hNum} ${sNum}% 38%`);
  root.style.setProperty('--brand-light', `${hNum} ${Math.max(sNum - 3, 0)}% 95%`);
  root.style.setProperty('--ring', primaryHsl);
  root.style.setProperty('--sidebar-primary', primaryHsl);
  root.style.setProperty('--sidebar-accent', `${hNum} ${Math.max(sNum - 3, 0)}% 95%`);

  if (theme.cor_secundaria) {
    const secondaryHsl = hexToHsl(theme.cor_secundaria);
    if (secondaryHsl) {
      root.style.setProperty('--accent', secondaryHsl);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [corretoraTheme, setCorretoraTheme] = useState<CorretoraTheme | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("nome, cargo, avatar_iniciais, role, corretora_id")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  // Fetch corretora theme when profile changes
  useEffect(() => {
    if (!profile?.corretora_id) {
      setCorretoraTheme(null);
      applyThemeColors(null);
      return;
    }

    const fetchTheme = async () => {
      const { data } = await supabase
        .from("corretoras")
        .select("cor_primaria, cor_secundaria, nome, logo_url")
        .eq("id", profile.corretora_id!)
        .single();

      if (data) {
        const theme: CorretoraTheme = {
          cor_primaria: data.cor_primaria,
          cor_secundaria: data.cor_secundaria,
          nome: data.nome,
          logo_url: data.logo_url,
        };
        setCorretoraTheme(theme);
        applyThemeColors(theme);
      }
    };

    fetchTheme();
  }, [profile?.corretora_id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setCorretoraTheme(null);
          applyThemeColors(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCorretoraTheme(null);
    applyThemeColors(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        corretoraTheme,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
