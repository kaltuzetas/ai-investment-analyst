import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const KEY = "ais_backtest_v1";

async function sbSave(o: BacktestOutcome, userId: string) {
  if (!supabase) return;
  try {
    await supabase.from("backtest_outcomes").upsert({
      history_id: o.historyId, user_id: userId, outcome: o.outcome, note: o.note, saved_at: o.savedAt,
    });
  } catch { /* silent — avoid leaking DB schema details to browser console */ }
}

async function sbLoad(): Promise<BacktestOutcome[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("backtest_outcomes").select("*")
      .order("saved_at", { ascending: false }).limit(500);
    if (error) throw error;
    return (data || []).map((r) => ({
      historyId: r.history_id as string, outcome: r.outcome as BacktestOutcome["outcome"],
      note: r.note as string, savedAt: r.saved_at as number,
    }));
  } catch { return null; }
}

export interface BacktestOutcome {
  historyId: string;
  outcome: "correct" | "incorrect" | "partial";
  note: string;
  savedAt: number;
}

function load(): BacktestOutcome[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function persist(o: BacktestOutcome[]) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
}

export function useBacktest(userId?: string) {
  const [outcomes, setOutcomes] = useState<BacktestOutcome[]>(load);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    // [FIX C-2] Clear state on logout — prevents previous user's backtest data
    // from persisting in localStorage and memory on a shared device.
    if (!userId) {
      if (wasAuthenticated) {
        setOutcomes([]);
        persist([]);
      }
      return;
    }

    let cancelled = false;
    sbLoad().then((remote) => {
      if (cancelled || !remote) return;
      setOutcomes((prev) => {
        const remoteIds = new Set(remote.map((r) => r.historyId));
        const localOnly = prev.filter((l) => !remoteIds.has(l.historyId));
        const merged = [...remote, ...localOnly];
        persist(merged);
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveOutcome = useCallback((historyId: string, outcome: BacktestOutcome["outcome"], note: string) => {
    // [FIX] Create entry BEFORE setOutcomes. React functional updaters run lazily during
    // reconciliation — any variable set inside the updater is undefined when checked
    // synchronously outside it. sbSave was never called with the previous pattern.
    const entry: BacktestOutcome = { historyId, outcome, note, savedAt: Date.now() };
    setOutcomes(prev => {
      const existing = prev.findIndex(o => o.historyId === historyId);
      const updated = existing >= 0
        ? prev.map((o, i) => i === existing ? entry : o)
        : [entry, ...prev];
      persist(updated);
      return updated;
    });
    if (userId) sbSave(entry, userId);
  }, [userId]);

  const getOutcome = useCallback((historyId: string) =>
    outcomes.find(o => o.historyId === historyId),
  [outcomes]);

  return { outcomes, saveOutcome, getOutcome };
}
