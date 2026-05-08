import { AnalysisData } from "@/types";

const CACHE_KEY = "ais_cache_v1";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_ENTRIES = 30;

interface CacheEntry {
  data: AnalysisData;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

// [FIX] In-memory store as primary layer — avoids JSON.parse on every getFromCache call.
// localStorage is only read once on first access, then written on mutations.
let memStore: CacheStore | null = null;

function getStore(): CacheStore {
  if (memStore !== null) return memStore;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    memStore = raw ? JSON.parse(raw) : {};
  } catch {
    memStore = {};
  }
  return memStore!;
}

function persist(store: CacheStore) {
  memStore = store;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // storage full — clear oldest half and retry
    const entries = Object.entries(store).sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const trimmed = Object.fromEntries(entries.slice(Math.floor(entries.length / 2)));
    memStore = trimmed;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed)); } catch {}
  }
}

export function cacheKey(query: string, lang: string, userId?: string): string {
  const base = `${query.trim().toUpperCase()}:${lang}`;
  return userId ? `${base}:${userId}` : base;
}

export function getFromCache(key: string): { data: AnalysisData; ageMs: number } | null {
  const store = getStore();
  const entry = store[key];
  if (!entry) return null;
  const ageMs = Date.now() - entry.cachedAt;
  if (ageMs > TTL_MS) {
    const { [key]: _evicted, ...rest } = store;
    persist(rest);
    return null;
  }
  return { data: entry.data, ageMs };
}

export function putInCache(key: string, data: AnalysisData) {
  const store = getStore();
  const next: CacheStore = { ...store, [key]: { data, cachedAt: Date.now() } };
  const entries = Object.entries(next);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    persist(Object.fromEntries(entries.slice(entries.length - MAX_ENTRIES)));
  } else {
    persist(next);
  }
}

export function invalidateCache(key: string) {
  const { [key]: _removed, ...rest } = getStore();
  persist(rest);
}

export function clearUserCache(userId: string) {
  const suffix = `:${userId}`;
  const store = getStore();
  const filtered = Object.fromEntries(
    Object.entries(store).filter(([k]) => !k.endsWith(suffix))
  );
  persist(filtered);
}

export function formatCacheAge(ageMs: number, lang: "ru" | "en"): string {
  const mins = Math.floor(ageMs / 60000);
  const hours = Math.floor(mins / 60);
  if (lang === "ru") {
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин. назад`;
    return `${hours} ч. назад`;
  } else {
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${hours}h ago`;
  }
}
