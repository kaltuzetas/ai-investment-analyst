import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserPrefs {
  emailAlerts: boolean;
  weeklyDigest: boolean;
}

const DEFAULTS: UserPrefs = { emailAlerts: false, weeklyDigest: false };

export function useUserPreferences(userId?: string) {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    let cancelled = false;
    Promise.resolve(
      supabase.from("user_preferences").select("email_alerts, weekly_digest")
        .eq("user_id", userId).single()
    ).then(({ data }) => {
      if (cancelled || !data) return;
      setPrefs({
        emailAlerts: data.email_alerts ?? false,
        weeklyDigest: data.weekly_digest ?? false,
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  const save = useCallback(async (next: UserPrefs) => {
    if (!userId || !supabase) return;
    const prev = prefs;
    setSaving(true);
    setPrefs(next);
    try {
      await supabase.from("user_preferences").upsert({
        user_id: userId,
        email_alerts: next.emailAlerts,
        weekly_digest: next.weeklyDigest,
        updated_at: new Date().toISOString(),
      });
    } catch {
      setPrefs(prev);
    } finally { setSaving(false); }
  }, [userId, prefs]);

  return { prefs, saving, save };
}
