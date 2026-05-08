import { useState } from "react";
import { Lang, PortfolioItem } from "@/types";
import { useTinkoffImport, TinkoffAccount } from "@/hooks/useTinkoffImport";

interface Props {
  lang: Lang;
  onImport: (items: PortfolioItem[]) => void;
  onClose: () => void;
}

export function TinkoffImportModal({ lang, onImport, onClose }: Props) {
  const ru = lang !== "en";
  const [token, setToken] = useState("");
  const [accounts, setAccounts] = useState<TinkoffAccount[] | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [preview, setPreview] = useState<(PortfolioItem & { _currentPrice?: number | null })[] | null>(null);
  const [step, setStep] = useState<"token" | "accounts" | "preview">("token");
  const { importPortfolio, loading, error, setError } = useTinkoffImport();

  const handleTokenSubmit = async () => {
    if (!token.trim()) return;
    const result = await importPortfolio(token.trim());
    if (!result) return;

    if (result.positions === null && result.accounts.length > 1) {
      // Need account selection
      setAccounts(result.accounts);
      setStep("accounts");
    } else {
      setAccounts(result.accounts);
      setPreview(result.positions ?? []);
      setStep("preview");
    }
  };

  const handleAccountSelect = async (accountId: string) => {
    setSelectedAccount(accountId);
    const result = await importPortfolio(token.trim(), accountId);
    if (!result) return;
    setPreview(result.positions ?? []);
    setStep("preview");
  };

  const handleConfirm = () => {
    if (!preview?.length) return;
    // Strip _currentPrice before passing to portfolio (it's not part of PortfolioItem type)
    const items: PortfolioItem[] = preview.map(({ _currentPrice: _cp, ...item }) => ({
      ...item,
      lastAnalysis: null as unknown as import("@/types").AnalysisData,
    }));
    onImport(items);
    onClose();
  };

  const accountTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      ACCOUNT_TYPE_TINKOFF: ru ? "Брокерский" : "Brokerage",
      ACCOUNT_TYPE_TINKOFF_IIS: ru ? "ИИС" : "IIS",
      ACCOUNT_TYPE_INVEST_BOX: ru ? "Копилка" : "Savings",
    };
    return map[type] || type;
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 24px", maxWidth: 480, width: "100%", animation: "fadeUp 0.25s ease both", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ color: "#ffd900", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 2 }}>
              🏦 {ru ? "Импорт из Т-Инвестиций" : "Import from T-Invest"}
            </div>
            <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace" }}>
              {ru ? "Данные только для чтения — токен не сохраняется" : "Read-only — token is never stored"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Step: token input */}
        {step === "token" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#666678", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8 }}>
                {ru ? "ТОКЕН ДОСТУПА (READ-ONLY)" : "ACCESS TOKEN (READ-ONLY)"}
              </div>
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setError(null); }}
                placeholder={ru ? "Вставьте токен из Т-Инвестиций…" : "Paste token from T-Invest…"}
                style={{ width: "100%", background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                onKeyDown={e => { if (e.key === "Enter") handleTokenSubmit(); }}
              />
            </div>
            <div style={{ background: "rgba(255,217,0,0.06)", border: "1px solid rgba(255,217,0,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
              <div style={{ color: "#888870", fontSize: 10, fontFamily: "monospace", lineHeight: 1.6 }}>
                {ru
                  ? "Как получить токен:\n1. Откройте Т-Инвестиции → Ещё → Настройки → Токены\n2. Нажмите «Сгенерировать токен» → выберите «Только чтение»\n3. Скопируйте и вставьте сюда"
                  : "How to get token:\n1. Open T-Invest → More → Settings → Tokens\n2. Click 'Generate token' → select 'Read only'\n3. Copy and paste here"}
                <br />
                <span style={{ color: "#444456" }}>
                  {ru ? "⚠ Используйте только read-only токен" : "⚠ Use read-only token only"}
                </span>
              </div>
            </div>
            {error && (
              <div style={{ color: "#ff4d4d", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>⚠ {error}</div>
            )}
            <button
              disabled={!token.trim() || loading}
              onClick={handleTokenSubmit}
              style={{ width: "100%", background: loading || !token.trim() ? "var(--border2)" : "linear-gradient(135deg,#ffd900,#c9a84c)", border: "none", borderRadius: 9, padding: "12px", color: loading || !token.trim() ? "#444456" : "#111", fontSize: 13, fontWeight: 700, cursor: !token.trim() || loading ? "not-allowed" : "pointer", fontFamily: "monospace", transition: "all 0.2s" }}
            >
              {loading ? (ru ? "Подключение…" : "Connecting…") : (ru ? "Подключить →" : "Connect →")}
            </button>
          </>
        )}

        {/* Step: account selection */}
        {step === "accounts" && accounts && (
          <>
            <div style={{ color: "#666678", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 12 }}>
              {ru ? "ВЫБЕРИТЕ СЧЁТ" : "SELECT ACCOUNT"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleAccountSelect(acc.id)}
                  disabled={loading}
                  style={{ background: selectedAccount === acc.id ? "rgba(255,217,0,0.1)" : "var(--border2)", border: `1px solid ${selectedAccount === acc.id ? "rgba(255,217,0,0.4)" : "var(--border)"}`, borderRadius: 9, padding: "12px 16px", cursor: "pointer", textAlign: "left", opacity: loading ? 0.6 : 1 }}
                >
                  <div style={{ color: "var(--text2)", fontSize: 13, fontFamily: "monospace", marginBottom: 3 }}>{acc.name}</div>
                  <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace" }}>{accountTypeLabel(acc.type)} · {acc.id.slice(0, 8)}…</div>
                </button>
              ))}
            </div>
            {error && <div style={{ color: "#ff4d4d", fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>⚠ {error}</div>}
            {loading && <div style={{ color: "#666678", fontSize: 11, fontFamily: "monospace", textAlign: "center" }}>{ru ? "Загрузка позиций…" : "Loading positions…"}</div>}
          </>
        )}

        {/* Step: preview */}
        {step === "preview" && preview && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "#666678", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em" }}>
                {ru ? `НАЙДЕНО ПОЗИЦИЙ: ${preview.length}` : `FOUND ${preview.length} POSITIONS`}
              </div>
              <button onClick={() => setStep("token")} style={{ background: "none", border: "none", color: "#444456", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>
                {ru ? "← Назад" : "← Back"}
              </button>
            </div>

            {preview.length === 0 ? (
              <div style={{ color: "#444456", fontSize: 13, textAlign: "center", padding: "20px 0", fontFamily: "monospace" }}>
                {ru ? "Позиций не найдено" : "No positions found"}
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
                {preview.map((pos, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border2)" }}>
                    <div>
                      <div style={{ color: "var(--text)", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>{pos.ticker}</div>
                      <div style={{ color: "#666678", fontSize: 10, fontFamily: "monospace" }}>{pos.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {pos.qty != null && (
                        <div style={{ color: "#8b9cf7", fontSize: 12, fontFamily: "monospace" }}>{pos.qty} {ru ? "шт." : "pcs"}</div>
                      )}
                      {pos.avgPrice != null && (
                        <div style={{ color: "#666678", fontSize: 10, fontFamily: "monospace" }}>
                          {ru ? "ср.цена" : "avg"} {pos.currency === "RUB" ? "₽" : pos.currency === "USD" ? "$" : pos.currency}{pos.avgPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {preview.length > 0 && (
              <div style={{ background: "rgba(139,156,247,0.06)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#8b9cf7", fontSize: 10, fontFamily: "monospace" }}>
                {ru
                  ? "После импорта запустите AI-анализ для каждой позиции для получения аналитики."
                  : "After import, run AI analysis on each position to get analytical insights."}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleConfirm}
                disabled={!preview.length}
                style={{ flex: 1, background: preview.length ? "linear-gradient(135deg,#ffd900,#c9a84c)" : "var(--border2)", border: "none", borderRadius: 9, padding: "11px", color: preview.length ? "#111" : "#444456", fontSize: 13, fontWeight: 700, cursor: preview.length ? "pointer" : "not-allowed", fontFamily: "monospace" }}
              >
                {ru ? `Добавить ${preview.length} позиций →` : `Add ${preview.length} positions →`}
              </button>
              <button onClick={onClose} style={{ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "11px 18px", color: "#55556a", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>
                {ru ? "Отмена" : "Cancel"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
