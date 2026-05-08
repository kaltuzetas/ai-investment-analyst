import { Lang, PortfolioItem, PortfolioIntelligence } from "@/types";
import { TR } from "@/constants/translations";
import { Spinner } from "@/components/atoms";
import { PortfolioIntelligenceView } from "./PortfolioIntelligence";
import { PortfolioItemCard } from "./PortfolioItem";
import { useLivePrice } from "@/hooks/useLivePrice";

function BenchmarkBar({ label, pct, color }: { label: string; pct: number | null; color: string }) {
  if (pct === null) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 80, fontSize: 10, color: "#555568", fontFamily: "monospace" }}>{label}</div>
      <div style={{ color: "#333344", fontSize: 11, fontFamily: "monospace" }}>—</div>
    </div>
  );
  const abs = Math.abs(pct);
  const MAX_W = 120;
  const barW = Math.min(abs / 100 * MAX_W * 3, MAX_W);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 80, fontSize: 10, color: "#555568", fontFamily: "monospace", flexShrink: 0 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <div style={{ width: MAX_W, background: "var(--border2)", borderRadius: 3, height: 6, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ width: barW, height: "100%", borderRadius: 3, background: color }} />
        </div>
        <span style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function BenchmarkWidget({ portfolio, lang }: { portfolio: PortfolioItem[]; lang: Lang }) {
  const ru = lang !== "en";
  const btc = useLivePrice("BTC");
  const spy = useLivePrice("SPY");

  // Weighted portfolio P&L%: Σ(cost_i) / Σ(cost_i) baseline vs Σ(current_value_i)
  let totalCost = 0, totalCurrent = 0, hasData = false;
  for (const item of portfolio) {
    if (item.avgPrice == null || item.qty == null || item.qty <= 0 || item.avgPrice <= 0) continue;
    const curP = item.lastAnalysis?.valuation?.currentPrice ?? null;
    if (curP == null) continue;
    totalCost += item.avgPrice * item.qty;
    totalCurrent += curP * item.qty;
    hasData = true;
  }
  const portfolioPnL = hasData && totalCost > 0 ? (totalCurrent - totalCost) / totalCost * 100 : null;

  const portfolioColor = portfolioPnL === null ? "#555568" : portfolioPnL >= 0 ? "#00d084" : "#ff4d4d";
  const btcColor = (btc.change24h ?? 0) >= 0 ? "#00d084" : "#ff4d4d";
  const spyColor = (spy.change24h ?? 0) >= 0 ? "#00d084" : "#ff4d4d";

  return (
    <div style={{ background: "rgba(139,156,247,0.04)", border: "1px solid rgba(139,156,247,0.15)", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ color: "#444458", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 12 }}>
        {ru ? "СРАВНЕНИЕ С БЕНЧМАРКОМ" : "BENCHMARK COMPARISON"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <BenchmarkBar
          label={ru ? "Портфель" : "Portfolio"}
          pct={portfolioPnL}
          color={portfolioColor}
        />
        <BenchmarkBar
          label="BTC 24h"
          pct={btc.loading ? null : btc.change24h}
          color={btcColor}
        />
        <BenchmarkBar
          label="SPY 24h"
          pct={spy.loading ? null : spy.change24h}
          color={spyColor}
        />
      </div>
      {!hasData && (
        <div style={{ color: "#333348", fontSize: 10, fontFamily: "monospace", marginTop: 10 }}>
          {ru ? "* P&L портфеля считается по последнему анализу. Обновите анализы активов для актуальных данных." : "* Portfolio P&L is based on last analysis price. Re-analyze assets for fresh data."}
        </div>
      )}
      {hasData && (
        <div style={{ color: "#333348", fontSize: 10, fontFamily: "monospace", marginTop: 10 }}>
          {ru ? "* P&L от средней цены входа · BTC и SPY — изменение за 24ч" : "* P&L from avg entry price · BTC & SPY — 24h change"}
        </div>
      )}
    </div>
  );
}

interface Props {
  lang: Lang;
  onGoAnalyze: () => void;
  portfolio: PortfolioItem[];
  loading: boolean;
  intelligence: PortfolioIntelligence | null;
  intelligenceLoading: boolean;
  intelligenceError: string | null;
  removeItem: (id: string) => void;
  analyzePortfolio: () => void;
  onImportTinkoff?: () => void;
  isAuthenticated?: boolean;
}

export function PortfolioView({ lang, onGoAnalyze, portfolio, loading, intelligence, intelligenceLoading, intelligenceError, removeItem, analyzePortfolio, onImportTinkoff, isAuthenticated }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const ru = lang !== "en";

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;
  }

  if (portfolio.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "70px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: .3 }}>💼</div>
        <div style={{ color: "var(--text3)", fontSize: 15, fontStyle: "italic", marginBottom: 12 }}>{t("emptyPort")}</div>
        <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>{t("emptyPortSub")}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onGoAnalyze} style={{ background: "var(--border)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}>
            {t("goAnalyze")}
          </button>
          {isAuthenticated && onImportTinkoff && (
            <button
              onClick={onImportTinkoff}
              style={{ background: "rgba(255,217,0,0.08)", border: "1px solid rgba(255,217,0,0.25)", color: "#ffd900", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}
            >
              🏦 {ru ? "Импорт из Т-Инвестиций" : "Import T-Invest"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8 }}>
        {isAuthenticated && onImportTinkoff && (
          <button
            onClick={onImportTinkoff}
            style={{ background: "rgba(255,217,0,0.08)", border: "1px solid rgba(255,217,0,0.25)", color: "#ffd900", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 12, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}
          >
            🏦 {ru ? "Импорт из Т-Инвестиций" : "Import T-Invest"}
          </button>
        )}
        <button
          onClick={analyzePortfolio}
          disabled={intelligenceLoading || portfolio.length < 2}
          style={{ background: "rgba(139,156,247,0.15)", border: "1px solid rgba(139,156,247,0.3)", color: "#8b9cf7", borderRadius: 8, padding: "9px 18px", cursor: portfolio.length < 2 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 8, opacity: portfolio.length < 2 ? .4 : 1, marginLeft: "auto" }}
        >
          {intelligenceLoading ? <><Spinner size={13} color="#8b9cf7" />{t("piLoad")}</> : t("piBtn")}
        </button>
      </div>

      {intelligenceError && (
        <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ff7070", fontSize: 12, fontFamily: "monospace" }}>
          ⚠ {intelligenceError}
        </div>
      )}
      {intelligence && <PortfolioIntelligenceView data={intelligence} lang={lang} />}

      <BenchmarkWidget portfolio={portfolio} lang={lang} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {portfolio.map((item) => (
          <PortfolioItemCard
            key={item.id}
            item={item}
            lang={lang}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
