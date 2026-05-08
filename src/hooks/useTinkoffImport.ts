import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PortfolioItem } from "@/types";

export interface TinkoffAccount {
  id: string;
  name: string;
  type: string;
}

export interface TinkoffImportResult {
  accounts: TinkoffAccount[];
  positions: (PortfolioItem & { _currentPrice?: number | null })[] | null;
}

const PROXY = import.meta.env.VITE_PROXY_URL as string || "";

async function getJwt(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function useTinkoffImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importPortfolio = useCallback(async (
    token: string,
    accountId?: string
  ): Promise<TinkoffImportResult | null> => {
    const jwt = await getJwt();
    if (!jwt) { setError("Требуется авторизация"); return null; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY}/api/tinkoff/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, ...(accountId ? { accountId } : {}) }),
      });
      const data = await res.json() as TinkoffImportResult & { error?: string; message?: string };
      if (!res.ok) {
        setError(data.message || data.error || "Ошибка импорта");
        return null;
      }
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { importPortfolio, loading, error, setError };
}
