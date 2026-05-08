import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface PredictionsStats {
  total: number;
  verified: number;
  correct: number;
  incorrect: number;
  partial: number;
  pending: number;
  accuracyPct: number | null;
  avgGainOnCorrect: number | null; // average % gain on correct buy signals
  lastVerifiedAt: string | null;
  recentPredictions: Array<{
    ticker: string;
    action: string;
    confidence: string;
    priceAt: number;
    currency: string;
    createdAt: string;
    verifiedAt: string | null;
    outcome: string | null;
    priceAtVerify: number | null;
  }>;
}

const EMPTY: PredictionsStats = {
  total: 0, verified: 0, correct: 0, incorrect: 0, partial: 0, pending: 0,
  accuracyPct: null, avgGainOnCorrect: null, lastVerifiedAt: null, recentPredictions: [],
};

export function usePredictionsStats(): PredictionsStats {
  const [stats, setStats] = useState<PredictionsStats>(EMPTY);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from("predictions")
      .select("ticker,action,confidence,price_at,currency,created_at,verified_at,outcome,price_at_verify")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const total     = data.length;
        const verified  = data.filter(r => r.outcome && r.outcome !== "pending").length;
        const correct   = data.filter(r => r.outcome === "correct").length;
        const incorrect = data.filter(r => r.outcome === "incorrect").length;
        const partial   = data.filter(r => r.outcome === "partial").length;
        const pending   = data.filter(r => !r.outcome || r.outcome === "pending").length;
        const decided   = correct + incorrect;
        const accuracyPct = decided > 0 ? Math.round(correct / decided * 100) : null;

        // Average gain on correct buy signals
        const correctBuys = data.filter(r => r.outcome === "correct" && r.action === "buy" && r.price_at && r.price_at_verify);
        const avgGainOnCorrect = correctBuys.length > 0
          ? Math.round(correctBuys.reduce((sum, r) => sum + (r.price_at_verify - r.price_at) / r.price_at * 100, 0) / correctBuys.length * 10) / 10
          : null;

        const verifiedRows = data.filter(r => r.verified_at).sort((a, b) => b.verified_at!.localeCompare(a.verified_at!));
        const lastVerifiedAt = verifiedRows[0]?.verified_at ?? null;

        const recentPredictions = data.slice(0, 10).map(r => ({
          ticker: r.ticker,
          action: r.action,
          confidence: r.confidence,
          priceAt: r.price_at,
          currency: r.currency,
          createdAt: r.created_at,
          verifiedAt: r.verified_at,
          outcome: r.outcome,
          priceAtVerify: r.price_at_verify,
        }));

        if (!cancelled) setStats({ total, verified, correct, incorrect, partial, pending, accuracyPct, avgGainOnCorrect, lastVerifiedAt, recentPredictions });
      });

    return () => { cancelled = true; };
  }, []);

  return stats;
}
