import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PENDING_REF_KEY = "ais_pending_ref";

export function stashPendingRef() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref");
  if (code) {
    try { sessionStorage.setItem(PENDING_REF_KEY, code); } catch {}
    window.history.replaceState({}, "", window.location.pathname);
  }
}

export function popPendingRef(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_REF_KEY);
    sessionStorage.removeItem(PENDING_REF_KEY);
    return code;
  } catch { return null; }
}

export function useReferral(userId?: string) {
  const [code, setCode] = useState<string | null>(null);
  const [uses, setUses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    let cancelled = false;
    Promise.resolve(supabase.rpc("get_or_create_referral_code"))
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setCode(data as string);
        if (!supabase) return;
        return Promise.resolve(
          supabase.from("referral_codes").select("uses").eq("user_id", userId).single()
        );
      })
      .then(res => {
        if (cancelled || !res || res.error) return;
        setUses((res.data as { uses: number }).uses ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  const applyCode = useCallback(async (refCode: string): Promise<boolean> => {
    if (!userId || !supabase) return false;
    setLoading(true);
    try {
      // [SEC P2] p_user_id removed — RPC now uses auth.uid() to prevent privilege escalation
      const { data } = await supabase.rpc("apply_referral_code", {
        p_code: refCode,
      });
      return (data as { ok: boolean })?.ok === true;
    } catch { return false; }
    finally { setLoading(false); }
  }, [userId]);

  const getReferralUrl = useCallback(() => {
    if (!code) return null;
    return `${window.location.origin}${window.location.pathname}?ref=${code}`;
  }, [code]);

  const copyReferralUrl = useCallback(() => {
    const url = getReferralUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getReferralUrl]);

  return { code, uses, loading, copied, applyCode, getReferralUrl, copyReferralUrl };
}
