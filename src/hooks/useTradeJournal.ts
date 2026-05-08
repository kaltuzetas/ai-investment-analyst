import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const KEY = "ais_journal_v1";
const MAX = 200;

export interface JournalEntry {
  id: string;
  ticker: string;
  date: string;       // YYYY-MM-DD
  type: "buy" | "sell" | "note";
  price?: number;
  qty?: number;
  currency?: string;
  note: string;
  createdAt: number;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function sbSave(entry: JournalEntry, userId: string) {
  if (!supabase) return;
  try {
    await supabase.from("trade_journal").upsert({
      id: entry.id,
      user_id: userId,
      ticker: entry.ticker,
      date: entry.date,
      type: entry.type,
      price: entry.price ?? null,
      qty: entry.qty ?? null,
      currency: entry.currency ?? null,
      note: entry.note,
      created_at: entry.createdAt,
    });
  } catch { /* silent — avoid leaking DB schema details to browser console */ }
}

async function sbDelete(id: string) {
  if (!supabase) return;
  try {
    await supabase.from("trade_journal").delete().eq("id", id);
  } catch { /* silent */ }
}

async function sbLoad(): Promise<JournalEntry[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("trade_journal")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id as string,
      ticker: r.ticker as string,
      date: r.date as string,
      type: r.type as JournalEntry["type"],
      price: r.price as number | undefined,
      qty: r.qty as number | undefined,
      currency: r.currency as string | undefined,
      note: r.note as string,
      createdAt: r.created_at as number,
    }));
  } catch { return null; }
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function load(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function persist(e: JournalEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(e)); } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTradeJournal(userId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>(load);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Re-fetch from Supabase when user signs in or switches
  useEffect(() => {
    const wasAuthenticated = prevUserIdRef.current !== undefined;
    prevUserIdRef.current = userId;

    if (!userId) {
      if (wasAuthenticated) {
        // User signed out — clear in-memory state
        setEntries([]);
        persist([]);
      }
      return;
    }

    let cancelled = false;
    sbLoad().then((remote) => {
      if (cancelled || !remote) return;
      setEntries((prev) => {
        // Merge: remote is authoritative; append local-only entries not yet synced
        const remoteIds = new Set(remote.map((r) => r.id));
        const localOnly = prev.filter((l) => !remoteIds.has(l.id));
        const merged = [...remote, ...localOnly].slice(0, MAX);
        persist(merged);
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((entry: Omit<JournalEntry, "id" | "createdAt">) => {
    // Input validation — guard against malformed data before persisting
    const ticker = entry.ticker.trim().toUpperCase();
    if (!ticker || !/^[A-Z0-9.^-]{1,15}$/.test(ticker)) return;
    if (!["buy", "sell", "note"].includes(entry.type)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || isNaN(new Date(entry.date).getTime())) return;
    if (entry.price != null && (entry.price < 0 || !isFinite(entry.price))) return;
    if (entry.qty   != null && (entry.qty   < 0 || !isFinite(entry.qty)))   return;

    const full: JournalEntry = {
      ...entry,
      ticker,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setEntries(prev => {
      const updated = [full, ...prev].slice(0, MAX);
      persist(updated);
      return updated;
    });
    // Supabase side-effect outside updater — avoids double-call in React StrictMode
    if (userId) sbSave(full, userId);
  }, [userId]);

  const remove = useCallback((id: string) => {
    setEntries(prev => { const u = prev.filter(e => e.id !== id); persist(u); return u; });
    sbDelete(id);
  }, []);

  const byTicker = useCallback((ticker: string) =>
    entries.filter(e => e.ticker.toUpperCase() === ticker.toUpperCase()),
  [entries]);

  return { entries, add, remove, byTicker };
}
