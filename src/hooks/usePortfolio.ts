import { useState, useEffect, useCallback, useRef } from "react";
import { AnalysisData, Lang, PortfolioIntelligence, PortfolioItem } from "@/types";
import { makePortPrompt } from "@/prompts/portfolioPrompt";
import { callAPI } from "@/utils/apiCall";
import { mergeRemoteLocal } from "@/utils/mergeRemoteLocal";
import { supabase } from "@/lib/supabase";

const PORT_KEY = "ais_portfolio_v5";
const INTEL_KEY = "ais_portintel_v5";

// ── Supabase sync helpers ─────────────────────────────────────────────────────

async function sbSaveItem(item: PortfolioItem, userId: string) {
  if (!supabase) return;
  try {
    await supabase.from("portfolio_items").upsert({
      id: item.id,
      user_id: userId,
      ticker: item.ticker,
      name: item.name,
      currency: item.currency,
      qty: item.qty,
      avg_price: item.avgPrice,
      added_at: item.addedAt,
      analyzed_at: item.analyzedAt,
      last_analysis: item.lastAnalysis,
      updated_at: new Date().toISOString(),
    });
  } catch { /* silent — avoid leaking DB schema details to browser console */ }
}

async function sbDeleteItem(id: string) {
  if (!supabase) return;
  try {
    await supabase.from("portfolio_items").delete().eq("id", id);
  } catch { /* silent */ }
}

async function sbLoadItems(): Promise<PortfolioItem[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("added_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id as string,
      ticker: r.ticker as string,
      name: r.name as string,
      currency: r.currency as string,
      qty: r.qty as number | null,
      avgPrice: r.avg_price as number | null,
      addedAt: r.added_at as string,
      analyzedAt: (r.analyzed_at as string | null) ?? null,
      lastAnalysis: r.last_analysis as AnalysisData,
    }));
  } catch { return null; }
}

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}


export function usePortfolio(lang: Lang, userId?: string) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try { return JSON.parse(lsGet(PORT_KEY) ?? "[]"); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<PortfolioIntelligence | null>(() => {
    try { const v = lsGet(INTEL_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  });
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const analyzePortfolioCtrl = useRef<AbortController | null>(null);

  // Cancel in-flight portfolio analysis on unmount
  useEffect(() => () => { analyzePortfolioCtrl.current?.abort(); }, []);

  // Re-fetch from Supabase when user signs in (userId changes)
  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    if (!userId) {
      if (wasAuthenticated) {
        // User signed out — clear in-memory state so previous user's data is not shown
        setPortfolio([]);
        setIntelligence(null);
        lsSet(PORT_KEY, "[]");
        lsSet(INTEL_KEY, "");
      }
      return;
    }

    setLoading(true);
    let cancelled = false;
    sbLoadItems().then((remote) => {
      if (cancelled || !remote) return;
      // [K16] Use updater fn so we merge against current state, not stale localStorage snapshot.
      // Items added while the load was in-flight are preserved in `current`.
      setPortfolio((current) => {
        const merged = mergeRemoteLocal(remote, current);
        lsSet(PORT_KEY, JSON.stringify(merged));
        return merged;
      });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; setLoading(false); };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(
    (ticker: string, name: string, currency: string, qty: number | null, avgPrice: number | null, analysis: AnalysisData) => {
      const item: PortfolioItem = {
        id: crypto.randomUUID(),
        ticker, name, qty, avgPrice, currency,
        addedAt: new Date().toISOString(),
        lastAnalysis: analysis,
        analyzedAt: new Date().toISOString(),
      };
      setPortfolio((prev) => {
        const updated = [...prev, item];
        lsSet(PORT_KEY, JSON.stringify(updated));
        return updated;
      });
      if (userId) sbSaveItem(item, userId);
    },
    [userId]
  );

  const removeItem = useCallback(
    (id: string) => {
      setPortfolio((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        lsSet(PORT_KEY, JSON.stringify(updated));
        return updated;
      });
      sbDeleteItem(id);
    },
    []
  );

  // [FIX] Accept the full existing item to avoid needing to read state after setPortfolio.
  // The previous (id, analysis) signature tried to capture `updatedItem` inside the
  // setPortfolio updater and use it outside — but React 18 calls updaters lazily during
  // reconciliation, so the variable was always undefined at the sbSaveItem call site.
  const updateItemAnalysis = useCallback((baseItem: PortfolioItem, analysis: AnalysisData) => {
    const updatedItem: PortfolioItem = { ...baseItem, lastAnalysis: analysis, analyzedAt: new Date().toISOString() };
    setPortfolio((prev) => {
      const updated = prev.map((it) => it.id === baseItem.id ? updatedItem : it);
      lsSet(PORT_KEY, JSON.stringify(updated));
      return updated;
    });
    // sbSaveItem called outside the updater to avoid double-call in React StrictMode.
    // updatedItem is constructed above (not derived from state), so there is no race.
    if (userId) sbSaveItem(updatedItem, userId);
  }, [userId]);

  const analyzePortfolio = useCallback(async () => {
    if (portfolio.length < 2) return;
    analyzePortfolioCtrl.current?.abort();
    analyzePortfolioCtrl.current = new AbortController();
    const signal = analyzePortfolioCtrl.current.signal;
    setIntelligenceLoading(true);
    setIntelligenceError(null);
    try {
      const summary = portfolio.map((p) => ({
        ticker: p.ticker,
        sector: p.lastAnalysis?.asset?.sector,
        action: p.lastAnalysis?.recommendation?.action,
        risk: p.lastAnalysis?.riskProfile?.score,
      }));
      const ru = lang !== "en";
      const msg = ru
        ? `Проанализируй портфель ТОЛЬКО НА РУССКОМ: ${JSON.stringify(summary)}`
        : `Analyze portfolio IN ENGLISH: ${JSON.stringify(summary)}`;

      const data = (await callAPI([{ role: "user", content: msg }], makePortPrompt(lang), signal)) as PortfolioIntelligence;
      setIntelligence(data);
      lsSet(INTEL_KEY, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // component unmounted — discard silently
      setIntelligenceError((e as Error).message || "Analysis failed");
    } finally {
      setIntelligenceLoading(false);
    }
  }, [portfolio, lang]);

  const importItems = useCallback(
    (items: PortfolioItem[]) => {
      if (!items.length) return;
      setPortfolio((prev) => {
        const existingTickers = new Set(prev.map(p => p.ticker));
        const newItems = items.filter(item => !existingTickers.has(item.ticker));
        const updated = [...prev, ...newItems];
        lsSet(PORT_KEY, JSON.stringify(updated));
        if (userId) newItems.forEach(item => sbSaveItem(item, userId));
        return updated;
      });
    },
    [userId]
  );

  return { portfolio, loading, intelligence, intelligenceLoading, intelligenceError, addItem, removeItem, updateItemAnalysis, analyzePortfolio, importItems };
}
