import { Lang, PortfolioItem as PI } from "@/types";
import { ACTC, RISKC, KWAVEC, STATC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { TR } from "@/constants/translations";
import { Tag, MetricBox, Spinner } from "@/components/atoms";
import { useLivePrice } from "@/hooks/useLivePrice";

interface Props {
  item: PI;
  lang: Lang;
  onRemove: () => void;
}

export function PortfolioItemCard({ item, lang, onRemove }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const a = item.lastAnalysis;
  const cur = item.currency || "$";
  const livePrice = useLivePrice(item.ticker);
  // Prefer live price; fall back to analysis price
  const curP = livePrice.price ?? a?.valuation?.currentPrice ?? null;
  // [FIX] avgPrice > 0 guard: `item.avgPrice &&` would hide avgPrice=0 AND would
  // divide by zero if it somehow reached the expression. Explicit > 0 is clearer.
  const plP = item.avgPrice != null && item.avgPrice > 0 && curP != null
    ? ((curP - item.avgPrice) / item.avgPrice * 100)
    : null;

  const hoursAgo = item.analyzedAt
    ? (Date.now() - new Date(item.analyzedAt).getTime()) / (1000 * 60 * 60)
    : null;
  const isStale = hoursAgo !== null && hoursAgo > 24;

  const aC = a ? (ACTC[n(a.recommendation?.action) as keyof typeof ACTC] ?? ACTC.watch) : null;
  const rC = a ? (RISKC[n(a.riskProfile?.score) as keyof typeof RISKC] ?? RISKC.medium) : null;
  const kP = a ? (KWAVEC[n(a.kondratiev?.currentPhase) as keyof typeof KWAVEC] ?? null) : null;
  const sC = a ? (STATC[n(a.valuation?.status) as keyof typeof STATC] ?? STATC.fair) : null;

  const aL = a ? ({ buy: t("aB"), hold: t("aH"), sell: t("aS2"), watch: t("aW") }[n(a.recommendation?.action)] ?? t("aW")) : null;
  const rL = a ? t({ low: "rL", medium: "rM", high: "rH" }[n(a.riskProfile?.score)] ?? "rM") : "";
  const kL = a ? t({ spring: "kSp", summer: "kSu", autumn: "kAu", winter: "kWi" }[n(a.kondratiev?.currentPhase)] ?? "kAu") : "";

  return (
    <div style={{ background: "var(--border2)", border: `1px solid ${isStale ? "rgba(245,166,35,0.35)" : "var(--border)"}`, borderRadius: 12, padding: 20, animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{item.ticker}</div>
            <div style={{ fontSize: 12, color: "#55556a", marginTop: 2 }}>{item.name}</div>
          </div>
          {aC && aL && <Tag color={aC.c}>{aL}</Tag>}
          {rC && rL && <Tag color={rC.c}>{t("rkLbl")}: {rL}</Tag>}
          {kP && kL && <Tag color={kP.c}>{kL}</Tag>}
        </div>
        <div style={{ textAlign: "right" }}>
          {livePrice.loading && (
            <div style={{ fontSize: 11, color: "#55556a", fontFamily: "monospace", marginBottom: 2 }}>
              <Spinner size={10} /> {lang === "en" ? "Live..." : "Цена..."}
            </div>
          )}
          {curP != null && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
                <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{cur}{fmt(curP)}</div>
                {livePrice.price != null && (
                  <div style={{ fontSize: 10, color: "#00d08466", fontFamily: "monospace" }}>LIVE</div>
                )}
              </div>
              {livePrice.change24h != null && (
                <div style={{ fontSize: 11, color: livePrice.change24h >= 0 ? "#00d084" : "#ff4d4d", fontFamily: "monospace" }}>
                  {livePrice.change24h >= 0 ? "+" : ""}{livePrice.change24h.toFixed(2)}% 24h
                </div>
              )}
              {plP !== null && (
                <div style={{ fontSize: 12, color: plP >= 0 ? "#00d084" : "#ff4d4d", fontFamily: "monospace" }}>
                  {plP >= 0 ? "+" : ""}{plP.toFixed(2)}% {t("fromE")}
                </div>
              )}
            </>
          )}
          {curP == null && !livePrice.loading && (
            <div style={{ fontSize: 13, color: "#55556a", fontFamily: "monospace" }}>—</div>
          )}
        </div>
      </div>
      {/* [FIX] Use != null instead of truthiness — qty/avgPrice of 0 is valid (e.g. airdrop, sold position) */}
      {(item.qty != null || item.avgPrice != null) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {item.qty    != null && <MetricBox label={t("qLbl")}  value={fmt(item.qty, 4)} />}
          {item.avgPrice != null && <MetricBox label={t("apLbl")} value={`${cur}${fmt(item.avgPrice)}`} />}
          {item.qty != null && item.avgPrice != null && <MetricBox label={t("posLbl")} value={`${cur}${fmt(item.qty * item.avgPrice)}`} />}
          {item.qty != null && curP != null && (
            <MetricBox label={t("cvLbl")} value={`${cur}${fmt(item.qty * curP)}`} accent={plP !== null && plP >= 0 ? "#00d084" : "#ff4d4d"} />
          )}
        </div>
      )}
      {a && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 12 }}>
          {a.recommendation?.buyZoneLow && (
            <MetricBox label={t("bz")} value={`${cur}${fmt(a.recommendation.buyZoneLow)}–${fmt(a.recommendation.buyZoneHigh ?? a.recommendation.buyZoneLow)}`} accent="#00d084" />
          )}
          {a.valuation?.fairPrice && (
            <MetricBox label={t("fairVal")} value={`${cur}${fmt(a.valuation.fairPrice)}`} accent={sC?.c} sub={{ undervalued: t("undervalued"), overvalued: t("overvalued"), fair: t("fairVal") }[n(a.valuation?.status)] ?? ""} />
          )}
          {a.valuation?.growthPotential != null && (
            <MetricBox label={t("growthPot")} value={`${a.valuation.growthPotential > 0 ? "+" : ""}${a.valuation.growthPotential.toFixed(1)}%`} accent="#c9a84c" />
          )}
          {a.trendAnalysis?.return5y && <MetricBox label={t("r5y")} value={a.trendAnalysis.return5y} accent="#8b9cf7" />}
        </div>
      )}
      {a?.recommendation?.summary && (
        <p style={{ color: "#666678", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{a.recommendation.summary}</p>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {isStale && (
            <div style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 5, padding: "2px 8px", color: "#f5a623", fontSize: 10, fontFamily: "monospace" }}>
              ⚠ {t("staleData")} · {Math.floor(hoursAgo!)}{t("staleAgo")}
            </div>
          )}
          <div style={{ color: isStale ? "#f5a62366" : "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
            {item.analyzedAt ? `${t("updAt")} ${new Date(item.analyzedAt).toLocaleString(lang === "en" ? "en-US" : "ru-RU")}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onRemove} style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", color: "#ff4d4d66", borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>✕</button>
        </div>
      </div>
    </div>
  );
}
