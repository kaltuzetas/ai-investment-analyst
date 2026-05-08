import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getFromCache, cacheKey } from "./useCache";

const KEY = "ais_alerts_v1";

export interface Alert {
  id: string;
  ticker: string;
  name: string;
  lang: "ru" | "en";
  type: "buy_zone";
  triggeredAt?: number;
}

function load(): Alert[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function persist(a: Alert[]) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}
}

/** Check cached analysis: is current price inside the buy zone? */
function isTriggered(alert: Alert, userId?: string): boolean {
  const cached = getFromCache(cacheKey(alert.ticker, alert.lang, userId));
  if (!cached) return false;
  const { data } = cached;
  const price = data.valuation?.currentPrice;
  const low = data.recommendation?.buyZoneLow;
  const high = data.recommendation?.buyZoneHigh ?? low;
  if (price == null || low == null) return false;
  return price >= low && price <= (high ?? low);
}

export function useAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>(load);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    // [FIX C-3] Clear alerts on logout — prevents previous user's watchlist alerts
    // from leaking to the next user on a shared device.
    if (!userId) {
      if (wasAuthenticated) {
        setAlerts([]);
        persist([]);
      }
      return;
    }

    // Check triggers after sign-in — not during render (side-effect-free initializer)
    // Re-check when user logs in so cache lookup uses the correct userId key.
    setAlerts(prev => {
      const updated = prev.map(a =>
        !a.triggeredAt && isTriggered(a, userId) ? { ...a, triggeredAt: Date.now() } : a
      );
      const changed = updated.some((a, i) => a !== prev[i]);
      if (changed) persist(updated);
      return changed ? updated : prev;
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((ticker: string, name: string, lang: "ru" | "en") => {
    const a: Alert = { id: crypto.randomUUID(), ticker, name, lang, type: "buy_zone" };
    setAlerts(prev => {
      if (prev.some(al => al.ticker === ticker)) return prev;
      const updated = [a, ...prev];
      persist(updated);
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setAlerts(prev => { const u = prev.filter(a => a.id !== id); persist(u); return u; });
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts(prev => { const u = prev.filter(a => !a.triggeredAt); persist(u); return u; });
  }, []);

  const hasAlert = useCallback((ticker: string) => alerts.some(a => a.ticker === ticker), [alerts]);
  const triggered = useMemo(() => alerts.filter(a => !!a.triggeredAt), [alerts]);

  return { alerts, add, remove, clearTriggered, hasAlert, triggered };
}
