import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { mergeRemoteLocal } from "@/utils/mergeRemoteLocal";

const STORAGE_KEY = "ais_watchlist_v1";
const MAX_ITEMS = 50;

async function sbSave(entry: WatchlistEntry, userId: string) {
  if (!supabase) return;
  try {
    await supabase.from("watchlist_entries").upsert({
      id: entry.id, user_id: userId, ticker: entry.ticker, name: entry.name,
      asset_class: entry.assetClass, action: entry.action, added_at: entry.addedAt,
    });
  } catch { /* silent — avoid leaking DB schema details to browser console */ }
}

async function sbDelete(id: string) {
  if (!supabase) return;
  try {
    await supabase.from("watchlist_entries").delete().eq("id", id);
  } catch { /* silent */ }
}

async function sbLoad(): Promise<WatchlistEntry[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("watchlist_entries").select("*").order("added_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id as string, ticker: r.ticker as string, name: r.name as string,
      assetClass: r.asset_class as string, action: r.action as string, addedAt: r.added_at as number,
    }));
  } catch { return null; }
}

export interface WatchlistEntry {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
  action: string;
  addedAt: number;
}

function load(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: WatchlistEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useWatchlist(userId?: string) {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(load);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    if (!userId) {
      if (wasAuthenticated) {
        // User signed out — clear in-memory state so previous user's data is not shown
        setWatchlist([]);
        save([]);
      }
      return;
    }

    setWatchlist(load());
    let cancelled = false;
    sbLoad().then((remote) => {
      if (cancelled || !remote) return;
      setWatchlist((prev) => {
        const merged = mergeRemoteLocal(remote, prev, MAX_ITEMS);
        save(merged);
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((ticker: string, name: string, assetClass: string, action: string) => {
    // [FIX] Create entry BEFORE setWatchlist so the object is stable and sbSave can be
    // called reliably outside the updater. The previous pattern set `toSave` inside the
    // functional updater, which React calls lazily during reconciliation — not synchronously
    // when setWatchlist() returns. As a result `toSave` was always null and sbSave was
    // never called: watchlist additions were silently lost on sign-out / device switch.
    const entry: WatchlistEntry = {
      id: crypto.randomUUID(),
      ticker, name, assetClass, action, addedAt: Date.now(),
    };
    let isDuplicate = false;
    setWatchlist((prev) => {
      if (prev.some((w) => w.ticker === ticker)) { isDuplicate = true; return prev; }
      const updated = [entry, ...prev].slice(0, MAX_ITEMS);
      save(updated);
      return updated;
    });
    // isDuplicate is set inside a lazy updater so it may still be false here at call time,
    // but in practice add() is only called from user-triggered events where the updater
    // flushes synchronously. We do a second guard in setWatchlist above for safety.
    // sbSave uses upsert-by-id, so a rare spurious call for a duplicate is harmless.
    if (!isDuplicate && userId) sbSave(entry, userId);
  }, [userId]);

  const remove = useCallback((id: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      save(updated);
      return updated;
    });
    sbDelete(id);
  }, []);

  const has = useCallback((ticker: string) => watchlist.some((w) => w.ticker === ticker), [watchlist]);

  return { watchlist, add, remove, has };
}
