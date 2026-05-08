import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CURRENT_TOS_VERSION } from "@/constants/legal";

const LS_KEY = "ais_consent_v";

function lsGetVersion(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}
function lsSetVersion(v: string) {
  try { localStorage.setItem(LS_KEY, v); } catch {}
}

export function useConsent(userId?: string) {
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    // Fast path: localStorage — avoid async flicker on cold load
    const stored = lsGetVersion();
    return stored === CURRENT_TOS_VERSION;
  });
  const [loading, setLoading] = useState(false);

  // Verify against DB when user is logged in
  useEffect(() => {
    if (!userId || !supabase) return;
    if (hasConsented) return; // already confirmed locally
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase
          .from("user_consents")
          .select("tos_version")
          .eq("user_id", userId)
          .order("accepted_at", { ascending: false })
          .limit(1)
          .single();
        if (cancelled) return;
        if (data?.tos_version === CURRENT_TOS_VERSION) {
          lsSetVersion(CURRENT_TOS_VERSION);
          setHasConsented(true);
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [userId, hasConsented]);

  const recordConsent = useCallback(async () => {
    setLoading(true);
    lsSetVersion(CURRENT_TOS_VERSION);
    setHasConsented(true);

    if (!supabase) { setLoading(false); return; }

    try {
      const sessionId = (() => {
        try {
          let s = sessionStorage.getItem("ais_sid");
          if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("ais_sid", s); }
          return s;
        } catch { return null; }
      })();

      await supabase.from("user_consents").insert({
        user_id: userId ?? null,
        session_id: sessionId,
        tos_version: CURRENT_TOS_VERSION,
        user_agent: navigator.userAgent.slice(0, 200),
      });
    } catch { /* silent — consent is recorded in localStorage at minimum */ }
    finally { setLoading(false); }
  }, [userId]);

  // Reset when TOS version changes (forces re-consent)
  const needsConsent = !hasConsented;

  return { needsConsent, hasConsented, recordConsent, loading };
}
