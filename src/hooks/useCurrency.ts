import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ais_currency_v1";
const RATES_KEY = "ais_rates_v1";
const RATES_TTL = 4 * 60 * 60 * 1000; // 4h

export const CURRENCIES = ["USD", "EUR", "RUB", "GBP", "CNY"] as const;
export type Currency = typeof CURRENCIES[number];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: "$", EUR: "€", RUB: "₽", GBP: "£", CNY: "¥",
};

interface RatesCache { rates: Record<string, number>; ts: number }

function loadRates(): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const cache: RatesCache = JSON.parse(raw);
    if (Date.now() - cache.ts > RATES_TTL) return null;
    // [M1] Validate structure on read — malformed cached data (e.g. XSS-polluted
    // localStorage) must not silently produce wrong currency conversions.
    if (!cache.rates || typeof cache.rates !== "object" ||
        !cache.rates.EUR || !cache.rates.RUB || !cache.rates.GBP || !cache.rates.CNY) return null;
    return cache.rates;
  } catch { return null; }
}

async function fetchRates(signal?: AbortSignal): Promise<Record<string, number>> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 10000);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: ctrl.signal });
    const json = await res.json();
    const rates: Record<string, number> = json.rates ?? {};
    // [FIX M-1] Only cache if the response contains the currencies we need.
    // An empty or partial payload (API degradation) would cause silent wrong conversions.
    if (rates.EUR && rates.RUB && rates.GBP && rates.CNY) {
      try { localStorage.setItem(RATES_KEY, JSON.stringify({ rates, ts: Date.now() })); } catch {}
    }
    return rates;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function useCurrency() {
  const [selected, setSelectedState] = useState<Currency>(
    () => (localStorage.getItem(STORAGE_KEY) as Currency) || "USD"
  );
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    const cached = loadRates();
    if (cached) { setRates(cached); return; }
    const ctrl = new AbortController();
    fetchRates(ctrl.signal).then(setRates).catch(() => {});
    return () => { ctrl.abort(); };
  }, []);

  const setSelected = useCallback((c: Currency) => {
    setSelectedState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
  }, []);

  // Convert amount from sourceCurrency to selected currency
  const convert = useCallback((amount: number, fromCurrency = "USD"): number => {
    if (selected === fromCurrency) return amount;
    const fromRate = rates[fromCurrency] ?? 1;
    const toRate = rates[selected] ?? 1;
    return (amount / fromRate) * toRate;
  }, [selected, rates]);

  const symbol = CURRENCY_SYMBOL[selected] ?? "$";

  return { selected, setSelected, rates, convert, symbol };
}
