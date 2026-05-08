import { useState, useMemo } from "react";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { ACTC, RISKC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { getFromCache, cacheKey } from "@/hooks/useCache";
import { getDemoData } from "@/constants/demoData";
import { Tag } from "@/components/atoms";

interface Props {
  lang: Lang;
  onAnalyze: (ticker: string) => void;
  userId?: string;
}

const ASSETS = [
  { ticker: "AAPL",   name: "Apple",           cls: "stocks" },
  { ticker: "MSFT",   name: "Microsoft",        cls: "stocks" },
  { ticker: "NVDA",   name: "NVIDIA",           cls: "stocks" },
  { ticker: "GOOGL",  name: "Alphabet",         cls: "stocks" },
  { ticker: "AMZN",   name: "Amazon",           cls: "stocks" },
  { ticker: "META",   name: "Meta",             cls: "stocks" },
  { ticker: "TSLA",   name: "Tesla",            cls: "stocks" },
  { ticker: "BABA",   name: "Alibaba",          cls: "stocks" },
  { ticker: "SBER",   name: "Сбербанк",         cls: "stocks" },
  { ticker: "LKOH",   name: "Лукойл",           cls: "stocks" },
  { ticker: "BTC",    name: "Bitcoin",          cls: "crypto" },
  { ticker: "ETH",    name: "Ethereum",         cls: "crypto" },
  { ticker: "SOL",    name: "Solana",           cls: "crypto" },
  { ticker: "BNB",    name: "BNB",              cls: "crypto" },
  { ticker: "XRP",    name: "XRP",              cls: "crypto" },
  { ticker: "SPY",    name: "S&P 500 ETF",      cls: "etf"    },
  { ticker: "QQQ",    name: "Nasdaq ETF",       cls: "etf"    },
  { ticker: "GLD",    name: "Gold ETF",         cls: "etf"    },
  { ticker: "VT",     name: "World ETF",        cls: "etf"    },
  { ticker: "IMOEX",  name: "Индекс МосБиржи",  cls: "etf"    },
  { ticker: "T-BILL", name: "US Treasuries",    cls: "bonds"  },
  { ticker: "OFZ",    name: "ОФЗ",              cls: "bonds"  },
  { ticker: "HYG",    name: "High-Yield Bonds", cls: "bonds"  },
  { ticker: "TLT",    name: "Long-Term Bonds",  cls: "bonds"  },
] as const;

type ClassFilter = "all" | "stocks" | "crypto" | "etf" | "bonds";
type RecFilter   = "all" | "buy" | "hold" | "sell" | "watch";
type RiskFilter  = "all" | "low" | "medium" | "high";

const ACTION_COLOR: Record<string, string> = {
  buy: "#00d084", hold: "#f5a623", sell: "#ff4d4d", watch: "#8b9cf7",
};

export function ScreenerView({ lang, onAnalyze, userId }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;

  const [cls,  setCls]  = useState<ClassFilter>("all");
  const [rec,  setRec]  = useState<RecFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");

  const demoData = useMemo(() => getDemoData(lang), [lang]);

  // Resolve cached data for all assets — memoised to avoid 24 cache lookups per render
  const withCache = useMemo(() => ASSETS.map(asset => {
    const cached = getFromCache(cacheKey(asset.ticker, lang, userId));
    const demo = !cached ? demoData[asset.ticker] : null;
    const src = cached?.data ?? demo ?? null;
    return {
      ...asset,
      cached,
      isDemo: !cached && !!demo,
      action: n(src?.recommendation?.action ?? ""),
      riskScore: n(src?.riskProfile?.score ?? ""),
      sector: src?.asset?.sector ?? "",
      price: src?.valuation?.currentPrice,
      currency: src?.valuation?.currency ?? "$",
      growthPotential: src?.valuation?.growthPotential,
    };
  }), [lang, userId, demoData]);

  const visible = withCache.filter(a => {
    if (cls  !== "all" && a.cls !== cls) return false;
    if (rec  !== "all") {
      if (!a.cached && !a.isDemo) return false;
      if (a.action !== rec) return false;
    }
    if (risk !== "all") {
      if (!a.cached && !a.isDemo) return false;
      if (a.riskScore !== risk) return false;
    }
    return true;
  });

  const clsFilters: { id: ClassFilter; label: string }[] = [
    { id: "all",    label: t("scAll") },
    { id: "stocks", label: t("scStocks") },
    { id: "crypto", label: t("scCrypto") },
    { id: "etf",    label: t("scETF") },
    { id: "bonds",  label: t("scBonds") },
  ];

  const recFilters: { id: RecFilter; label: string; color: string }[] = [
    { id: "all",   label: t("scFilterAll"), color: "#555568" },
    { id: "buy",   label: t("aB"),          color: "#00d084" },
    { id: "hold",  label: t("aH"),          color: "#f5a623" },
    { id: "sell",  label: t("aS2"),         color: "#ff4d4d" },
    { id: "watch", label: t("aW"),          color: "#8b9cf7" },
  ];

  const riskFilters: { id: RiskFilter; label: string; color: string }[] = [
    { id: "all",    label: t("scFilterAll"), color: "#555568" },
    { id: "low",    label: t("rL"),          color: "#00d084" },
    { id: "medium", label: t("rM"),          color: "#f5a623" },
    { id: "high",   label: t("rH"),          color: "#ff4d4d" },
  ];

  const btnStyle = (active: boolean, color = "#c9a84c") => ({
    background: active ? `${color}18` : "var(--border2)",
    border: `1px solid ${active ? `${color}50` : "var(--border2)"}`,
    color: active ? color : "var(--text3)",
    borderRadius: 7,
    padding: "5px 13px",
    cursor: "pointer" as const,
    fontSize: 11,
    fontFamily: "monospace",
    transition: "all 0.15s",
  });

  const analyzedCount = withCache.filter(a => a.cached).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace" }}>
          {t("scTitle")}
        </div>
        {analyzedCount > 0 && (
          <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
            {lang === "ru" ? `${analyzedCount} из ${ASSETS.length} проанализировано` : `${analyzedCount} of ${ASSETS.length} analyzed`}
          </div>
        )}
      </div>

      {/* Demo data banner */}
      {withCache.some(a => a.isDemo) && withCache.filter(a => a.cached).length === 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: 8, borderLeft: "2px solid rgba(255,165,0,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>ℹ</span>
          <span style={{ color: "#aaa", fontSize: 11, fontFamily: "monospace" }}>
            {t("demoBanner")}
          </span>
        </div>
      )}

      {/* Класс актива */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {clsFilters.map(f => (
          <button key={f.id} onClick={() => setCls(f.id)} style={btnStyle(cls === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Рекомендация */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", minWidth: 88 }}>
          {t("scFilterRec")}:
        </span>
        {recFilters.map(f => (
          <button key={f.id} onClick={() => setRec(f.id)} style={btnStyle(rec === f.id, f.color)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Риск */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", minWidth: 88 }}>
          {t("scFilterRisk")}:
        </span>
        {riskFilters.map(f => (
          <button key={f.id} onClick={() => setRisk(f.id)} style={btnStyle(risk === f.id, f.color)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Результат */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)", fontSize: 13, fontStyle: "italic" }}>
          {lang === "ru"
            ? "Нет активов с такими фильтрами. Сначала проанализируйте несколько активов."
            : "No assets match these filters. Analyze some assets first."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
          {visible.map(asset => {
            const { cached, isDemo, action, riskScore, price, currency, growthPotential } = asset;
            const hasData = !!(cached || isDemo);
            const aC = action ? (ACTC[action as keyof typeof ACTC] ?? null) : null;
            const rC = riskScore ? (RISKC[riskScore as keyof typeof RISKC] ?? null) : null;

            return (
              <div
                key={asset.ticker}
                style={{
                  background: "var(--border2)",
                  border: isDemo
                    ? "1px dashed rgba(201,168,76,0.2)"
                    : `1px solid ${aC ? aC.br + "30" : "rgba(201,168,76,0.08)"}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "var(--text)", fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>
                      {asset.ticker}
                    </div>
                    <div style={{ color: "#444456", fontSize: 11, marginTop: 2 }}>{asset.name}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    {aC && action && (
                      <Tag color={ACTION_COLOR[action] ?? "#555568"}>
                        {action.toUpperCase()}
                      </Tag>
                    )}
                    {isDemo && (
                      <span style={{ color: "#333348", fontSize: 8, fontFamily: "monospace", border: "1px solid #333348", borderRadius: 3, padding: "1px 4px" }}>
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                {hasData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {price != null && (
                      <div style={{ color: "#ddd8cc", fontSize: 13, fontFamily: "monospace" }}>
                        {currency}{fmt(price)}
                      </div>
                    )}
                    {growthPotential != null && (
                      <div style={{ color: growthPotential >= 0 ? "#00d084" : "#ff4d4d", fontSize: 10, fontFamily: "monospace" }}>
                        {growthPotential >= 0 ? "+" : ""}{growthPotential.toFixed(1)}% {lang === "ru" ? "потенциал" : "potential"}
                      </div>
                    )}
                    {rC && riskScore && (
                      <div style={{ color: rC.c, fontSize: 10, fontFamily: "monospace" }}>
                        {t("rkLbl")}: {t({ low: "rL", medium: "rM", high: "rH" }[riskScore] ?? "rM")}
                      </div>
                    )}
                    {asset.sector && (
                      <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>
                        {asset.sector}
                      </div>
                    )}
                    {cached && (
                      <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>
                        {t("scLastAn")}: {new Date(cached.ageMs ? Date.now() - cached.ageMs : Date.now()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{t("scNoData")}</div>
                )}

                <button
                  onClick={() => onAnalyze(asset.ticker)}
                  style={{
                    background: cached ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.12)",
                    border: `1px solid rgba(201,168,76,${cached ? "0.15" : "0.3"})`,
                    color: "#c9a84c",
                    borderRadius: 6,
                    padding: "6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  {cached ? "↺" : t("scAnalyze")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
