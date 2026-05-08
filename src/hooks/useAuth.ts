import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { clearUserCache } from "@/hooks/useCache";

export interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string, metadata?: Record<string, string>) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseEnabled);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { subscription?.unsubscribe(); };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
  };

  /** Returns error message string on failure, null on success. */
  const signInWithEmail = async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase not configured";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return "Invalid email or password";
    return null;
  };

  /** Returns error message string on failure, null on success. */
  const signUpWithEmail = async (email: string, password: string, metadata?: Record<string, string>): Promise<string | null> => {
    if (!supabase) return "Supabase not configured";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    if (error) {
      if (error.status === 422) return "Password must be at least 6 characters";
      return "Could not create account, please try again";
    }
    return null;
  };

  /** Send a password reset email. Returns error message or null. */
  const resetPassword = async (email: string): Promise<string | null> => {
    if (!supabase) return "Supabase not configured";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?reset=1`,
    });
    if (error) return "Could not send reset email, please try again";
    return null;
  };

  const signOut = async () => {
    if (!supabase) return;
    const uid = user?.id;
    try {
      await supabase.auth.signOut();
    } finally {
      if (uid) clearUserCache(uid);
    }
  };

  return { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut };
}
