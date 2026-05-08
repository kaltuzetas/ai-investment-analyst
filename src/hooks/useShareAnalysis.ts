import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnalysisData, Lang } from "@/types";

const PENDING_SHARE_KEY = "ais_pending_share";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"; // 36 chars
  const limit = 256 - (256 % chars.length); // 252 — reject ≥252 to eliminate modulo bias
  const result: string[] = [];
  while (result.length < 8) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    for (const b of bytes) {
      if (b < limit) {
        result.push(chars[b % chars.length]);
        if (result.length === 8) break;
      }
    }
  }
  return result.join("");
}

export function stashPendingShare() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("share");
  if (id) {
    try { sessionStorage.setItem(PENDING_SHARE_KEY, id); } catch {}
    window.history.replaceState({}, "", window.location.pathname);
  }
}

export function popPendingShare(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_SHARE_KEY);
    sessionStorage.removeItem(PENDING_SHARE_KEY);
    return id;
  } catch { return null; }
}

export function useShareAnalysis() {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (data: AnalysisData, lang: Lang, userId?: string) => {
    if (!supabase) return;
    setSharing(true);
    setShareUrl(null);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const id = generateId();
        const { error } = await supabase.from("shared_analyses").insert({
          id,
          user_id: userId ?? null,
          ticker: data.asset?.ticker ?? "UNKNOWN",
          lang,
          data,
        });
        if (!error) {
          const url = `${window.location.origin}${window.location.pathname}?share=${id}`;
          setShareUrl(url);
          return;
        }
        if (error.code !== "23505") throw error; // only retry on unique_violation
      }
    } catch {
      // silently fail — share is non-critical
    } finally {
      setSharing(false);
    }
  }, []);

  const copyAndClose = useCallback((url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setShareUrl(null); }, 2000);
  }, []);

  const closeShare = useCallback(() => setShareUrl(null), []);

  const loadShared = useCallback(async (id: string): Promise<{ data: AnalysisData; lang: Lang } | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("shared_analyses")
        .select("data, lang")
        .eq("id", id)
        .gt("expires_at", new Date().toISOString())
        .single();
      if (error || !data) return null;
      return { data: data.data as AnalysisData, lang: data.lang as Lang };
    } catch { return null; }
  }, []);

  return { sharing, shareUrl, copied, share, copyAndClose, closeShare, loadShared };
}
