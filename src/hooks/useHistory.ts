import { useState, useEffect, useCallback, useRef } from "react";
import { AnalysisData } from "@/types";
import { supabase } from "@/lib/supabase";
import { mergeRemoteLocal } from "@/utils/mergeRemoteLocal";

const STORAGE_KEY = "ais_history_v1";
const MAX_ITEMS = 20;

async function sbSave(entry: HistoryEntry, userId: string) {
  if (!supabase) return;
  try {
    await supabase.from("history_entries").upsert({
      id: entry.id, user_id: userId,
      query: entry.query, ticker: entry.ticker, name: entry.name,
      action: entry.action, asset_class: entry.assetClass,
      searched_at: entry.searchedAt, lang: entry.lang,
      entry_price: entry.entryPrice ?? null,
    });
  } catch { /* silent — avoid leaking DB schema details to browser console */ }
}

async function sbDelete(id: string) {
  if (!supabase) return;
  try {
    await supabase.from("history_entries").delete().eq("id", id);
  } catch { /* silent */ }
}

async function sbClear(userId: string) {
  if (!supabase || !userId) return;
  try {
    // Use the passed userId (also the RLS-enforced auth.uid()) to scope the delete
    await supabase.from("history_entries").delete().eq("user_id", userId);
  } catch { /* silent */ }
}

async function sbClearBySession() {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("history_entries").delete().eq("user_id", user.id);
  } catch { /* silent */ }
}

async function sbLoad(): Promise<HistoryEntry[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("history_entries").select("*")
      .order("searched_at", { ascending: false }).limit(MAX_ITEMS);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id as string, query: r.query as string, ticker: r.ticker as string,
      name: r.name as string, action: r.action as string, assetClass: r.asset_class as string,
      searchedAt: r.searched_at as number, lang: r.lang as string,
      entryPrice: r.entry_price != null ? Number(r.entry_price) : undefined,
    }));
  } catch { return null; }
}

export interface HistoryEntry {
  id: string;
  query: string;
  ticker: string;
  name: string;
  action: string;
  assetClass: string;
  searchedAt: number;
  lang: string;
  entryPrice?: number;
}

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHistory(userId?: string) {
  const [history, setHistory] = useState<HistoryEntry[]>(load);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    if (!userId) {
      if (wasAuthenticated) {
        // User signed out — clear in-memory state so previous user's data is not shown
        setHistory([]);
        save([]);
      }
      return;
    }

    setHistory(load());
    let cancelled = false;
    sbLoad().then((remote) => {
      if (cancelled || !remote) return;
      setHistory((prev) => {
        const merged = mergeRemoteLocal(remote, prev, MAX_ITEMS);
        save(merged);
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback((query: string, data: AnalysisData, lang: string) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      query: query.trim(),
      ticker: data.asset?.ticker ?? query.trim().toUpperCase(),
      name: data.asset?.name ?? query.trim(),
      action: data.recommendation?.action ?? "watch",
      assetClass: data.asset?.assetClass ?? "stocks",
      searchedAt: Date.now(),
      lang,
      entryPrice: data.valuation?.currentPrice ?? undefined,
    };

    // Supabase side-effects are called outside the updater to avoid double-invocation
    // in React StrictMode (updaters may be called twice in development).
    setHistory((prev) => {
      const deduped = prev.filter((h) => !(h.ticker === entry.ticker && h.lang === entry.lang));
      const updated = [entry, ...deduped].slice(0, MAX_ITEMS);
      save(updated);
      return updated;
    });
    if (userId) sbSave(entry, userId);
  }, [userId]);

  const remove = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      save(updated);
      return updated;
    });
    sbDelete(id);
  }, []);

  const clear = useCallback(async () => {
    setHistory([]);
    save([]);
    // Prefer userId from hook state; fall back to active Supabase session
    // to handle the case where the local state lags behind (e.g. after sign-out race)
    // Await so a network failure is observable (caller can catch if needed)
    if (userId) await sbClear(userId);
    else await sbClearBySession();
  }, [userId]);

  return { history, push, remove, clear };
}
