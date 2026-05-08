import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface TrackRecordStats {
  total: number;
  correct: number;
  incorrect: number;
  partial: number;
  accuracyPct: number | null; // correct / (correct + incorrect) * 100, null if no data
}

const EMPTY: TrackRecordStats = { total: 0, correct: 0, incorrect: 0, partial: 0, accuracyPct: null };

export function useTrackRecord(userId?: string): TrackRecordStats {
  const [stats, setStats] = useState<TrackRecordStats>(EMPTY);

  useEffect(() => {
    if (!supabase || !userId) { setStats(EMPTY); return; }
    let cancelled = false;

    supabase
      .from("backtest_outcomes")
      .select("outcome")
      .eq("user_id", userId)
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const total     = data.length;
        const correct   = data.filter(r => r.outcome === "correct").length;
        const incorrect = data.filter(r => r.outcome === "incorrect").length;
        const partial   = data.filter(r => r.outcome === "partial").length;
        const decided   = correct + incorrect;
        const accuracyPct = decided > 0 ? Math.round(correct / decided * 100) : null;
        if (!cancelled) setStats({ total, correct, incorrect, partial, accuracyPct });
      });

    return () => { cancelled = true; };
  }, [userId]);

  return stats;
}
