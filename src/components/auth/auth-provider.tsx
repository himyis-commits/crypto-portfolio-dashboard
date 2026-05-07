"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enabled: boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const init = async () => {
      // Fallback for OAuth implicit flow where tokens come back in hash.
      // Some environments fail to auto-persist this on first load.
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token=") && hash.includes("refresh_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token }).catch(() => null);
          // Clean token hash from URL after persisting session.
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };
    void init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      enabled: Boolean(supabase),
      async signInWithOtp(email: string) {
        if (!supabase) return { error: "Supabase is not configured yet." };
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}`
                : undefined
          }
        });
        return error ? { error: error.message } : {};
      },
      async signInWithGoogle() {
        if (!supabase) return { error: "Supabase is not configured yet." };
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}` : undefined
          }
        });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      }
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

