import { repairJSON } from "@/utils/jsonRepair";
import { supabase } from "@/lib/supabase";

// [D3] BYOK removed entirely — all calls go through the proxy (JWT auth + quota).
// Direct Anthropic calls exposed the API key in the browser and let any tech-savvy
// user bypass payment by setting a localStorage key.

async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function parseResponse(res: Response): Promise<unknown> {
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (res.status === 402) throw new Error("FREE_LIMIT_REACHED");
  if (res.status === 403) throw new Error("EMAIL_NOT_CONFIRMED");
  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const errMsg = errJson?.error?.message || errJson?.message || `HTTP ${res.status}`;
    throw new Error(`API ${res.status}: ${errMsg}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "API error");
  const text = (json.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  if (!text) throw new Error("Empty response");
  const parsed = repairJSON(text) as Record<string, unknown>;
  if (json._proxy_meta) parsed._meta = json._proxy_meta;
  return parsed;
}

const ANTHROPIC_BODY = (system: string, messages: Array<{ role: string; content: string }>) =>
  JSON.stringify({
    model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system,
    messages,
  });

async function callViaProxy(
  messages: Array<{ role: string; content: string }>,
  system: string,
  signal: AbortSignal,
  forceRefresh = false
): Promise<unknown> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (forceRefresh) headers["X-Force-Refresh"] = "1";
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers,
    signal,
    body: ANTHROPIC_BODY(system, messages),
  });
  return parseResponse(res);
}

/** Sleep that resolves normally or rejects with AbortError when signal fires. */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

const REQUEST_TIMEOUT_MS = 60_000;

export async function callAPI(
  messages: Array<{ role: string; content: string }>,
  system: string,
  externalSignal?: AbortSignal,
  attempt = 1,
  forceRefresh = false
): Promise<unknown> {
  if (externalSignal?.aborted) throw new DOMException("Aborted", "AbortError");

  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  externalSignal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  const cleanup = () => {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", onAbort);
  };

  try {
    const result = await callViaProxy(messages, system, ctrl.signal, forceRefresh);
    cleanup();
    return result;
  } catch (e) {
    cleanup();
    const err = e as Error;

    if (err.name === "AbortError") {
      throw externalSignal?.aborted ? e : new Error("Request timed out (>60s)");
    }
    if (err.message === "AUTH_REQUIRED" || err.message === "FREE_LIMIT_REACHED" || err.message === "EMAIL_NOT_CONFIRMED") throw e;

    if (err.message === "Failed to fetch") {
      if (attempt === 1) {
        await abortableSleep(1500, externalSignal);
        return callAPI(messages, system, externalSignal, 2, forceRefresh);
      }
      throw new Error("Network error");
    }
    if (err.message.startsWith("API 5") && attempt === 1) {
      await abortableSleep(2000, externalSignal);
      return callAPI(messages, system, externalSignal, 2, forceRefresh);
    }
    throw e;
  }
}
