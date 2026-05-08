import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function usePaidCredits(userId?: string) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!supabase || !userId) { setCredits(null); return; }
    let cancelled = false;
    Promise.resolve(
      supabase
        .from("paid_credits")
        .select("credits")
        .eq("user_id", userId)
        .maybeSingle()
    ).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        // Не логируем детали ошибки Supabase в консоль (утечка схемы БД)
        setError("Не удалось загрузить баланс");
        return;
      }
      setCredits(data?.credits ?? 0);
      setError(null);
    }).catch(() => {
      if (!cancelled) setError("Ошибка сети при загрузке баланса");
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => { return refresh() ?? undefined; }, [refresh]);

  /**
   * Idempotency key генерируется ОДИН РАЗ на вызов buyDemo.
   * Если запрос потеряется и его повторят, бэкенд с той же парой
   * (user_id, idempotency_key) вернёт результат без двойного списания.
   */
  const pendingKeyRef = useRef<string | null>(null);

  const buyDemo = useCallback(async (amount: number): Promise<void> => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    // Генерируем ключ идемпотентности при первой попытке; при retry используем тот же
    if (!pendingKeyRef.current) {
      pendingKeyRef.current = crypto.randomUUID();
    }
    const idempotencyKey = pendingKeyRef.current;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ credits: amount, idempotency_key: idempotencyKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // [FIX] 409 DUPLICATE_REQUEST with already_processed:true means the server already
        // applied this payment successfully on a prior attempt. Treat as success: clear the
        // pending key so future payments can use a fresh UUID. App.tsx finally calls refresh().
        if (res.status === 409 && body.already_processed) {
          pendingKeyRef.current = null;
          return;
        }
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      // [M4] Use json.total (real accumulated balance from server) when available.
      // Falling back to `amount` (the purchase amount) would show the wrong balance
      // if the user already had credits — it would display the increment, not the total.
      // If server omits total, refresh() will fetch the real value from Supabase.
      if (typeof json.total === "number") {
        setCredits(json.total);
      } else {
        refresh();
      }
      // Сбрасываем ключ только после успешного ответа
      pendingKeyRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { credits, loading, error, refresh, buyDemo };
}
