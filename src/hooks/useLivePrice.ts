import { useState, useEffect, useRef } from "react";

export interface LivePriceData {
  price: number | null;
  currency: string;
  change24h: number | null;
  loading: boolean;
  error: string | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 100;            // [FIX] Prevent unbounded module-level Map growth
const cache = new Map<string, { data: LivePriceData; ts: number }>();

function cacheSet(key: string, value: { data: LivePriceData; ts: number }) {
  // Map iterates in insertion order — first key is the oldest → O(1) eviction
  if (!cache.has(key) && cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, value);
}

export function clearLiveCache() { cache.clear(); }

const IDLE: LivePriceData = { price: null, currency: "USD", change24h: null, loading: false, error: null };

export function useLivePrice(ticker: string): LivePriceData {
  const [state, setState] = useState<LivePriceData>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const key = ticker.toUpperCase().trim();
    if (!key) { setState(IDLE); return; }

    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState(cached.data);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState(s => ({ ...s, loading: true, error: null }));

    fetch(`/api/price/${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(typeof data.error === "string" ? data.error : String(data.error));
        const result: LivePriceData = {
          price: typeof data.price === "number" ? data.price : null,
          currency: (data.currency as string) || "USD",
          change24h: typeof data.change24h === "number" ? data.change24h : null,
          loading: false,
          error: null,
        };
        cacheSet(key, { data: result, ts: Date.now() });
        setState(result);
      })
      .catch(err => {
        if ((err as Error).name === "AbortError") return;
        setState(s => ({ ...s, loading: false, error: "price unavailable" }));
      });

    return () => { ctrl.abort(); };
  }, [ticker]);

  return state;
}
