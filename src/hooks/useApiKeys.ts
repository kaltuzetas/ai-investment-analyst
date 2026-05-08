import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  monthly_limit: number;
  used_this_month: number;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

const PROXY = import.meta.env.VITE_PROXY_URL as string || "";

async function getJwt(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function useApiKeys(userId?: string) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!userId) return;
    const jwt = await getJwt();
    if (!jwt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY}/api/v1/keys`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { keys: ApiKey[] };
      setKeys(data.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(async (name: string) => {
    const jwt = await getJwt();
    if (!jwt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY}/api/v1/keys`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { key: string; record: ApiKey };
      setNewRawKey(data.key);
      setKeys(prev => [data.record, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeKey = useCallback(async (id: string) => {
    const jwt = await getJwt();
    if (!jwt) return;
    try {
      await fetch(`${PROXY}/api/v1/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked: true } : k));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, []);

  const clearNewKey = useCallback(() => setNewRawKey(null), []);

  return { keys, loading, error, newRawKey, createKey, revokeKey, clearNewKey, refetch: fetchKeys };
}
