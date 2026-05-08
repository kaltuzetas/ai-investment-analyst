import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const FREE_LIMIT = 7;

interface CounterState {
  count: number | null; // null = loading or Supabase not configured
  remaining: number | null;
  isFree: boolean;
  loadError: boolean;  // true when Supabase returned an error (quota treated as exhausted)
}

const LOADING: CounterState = { count: null, remaining: null, isFree: true, loadError: false };

export function useRequestCounter(userId?: string) {
  const [state, setState] = useState<CounterState>(LOADING);

  const refresh = useCallback(() => {
    if (!supabase || !userId) {
      setState({ count: null, remaining: null, isFree: true, loadError: false });
      return;
    }
    let cancelled = false;
    supabase
      .from("user_request_counts")
      .select("free_count")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // [FIX L-2] Treat DB error as "quota exhausted" rather than staying in
        // the loading state (isFree: true), which would give free passes during outages.
        // loadError=true lets the UI show a retry prompt instead of a misleading "limit reached".
        // Fail-open to match proxy behaviour: let the request through, expose loadError so UI
        // can show a soft warning rather than blocking the user behind a paywall during DB outages.
        if (error) { setState({ count: null, remaining: null, isFree: true, loadError: true }); return; }
        const count = data?.free_count ?? 0;
        const remaining = Math.max(0, FREE_LIMIT - count);
        setState({ count, remaining, isFree: remaining > 0, loadError: false });
      });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => { return refresh() ?? undefined; }, [refresh]);

  return { ...state, FREE_LIMIT, refresh };
}
