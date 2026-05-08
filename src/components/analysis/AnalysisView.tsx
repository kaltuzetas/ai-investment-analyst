import { useState, useCallback } from "react";
import { AnalysisData, Lang } from "@/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ACTC, RISKC, KWAVEC, MACROC } from "@/constants/colors";
import { n } from "@/utils/format";
import { TR } from "@/constants/translations";
import { Tag } from "@/components/atoms";
import { AssetInfo } from "./sections/AssetInfo";
import { Valuation } from "./sections/Valuation";
import { TrendAnalysis } from "./sections/TrendAnalysis";
import { Kondratiev } from "./sections/Kondratiev";
import { MacroBackground } from "./sections/MacroBackground";
import { Technical } from "./sections/Technical";
import { Sentiment } from "./sections/Sentiment";
import { Historical } from "./sections/Historical";
import { Growth } from "./sections/Growth";
import { MarketHeat } from "./sections/MarketHeat";
import { RiskProfile } from "./sections/RiskProfile";
import { CryptoMetrics } from "./sections/CryptoMetrics";
import { ActionPlan } from "./sections/ActionPlan";
import { Sources } from "./sections/Sources";

const DETAILS_KEY = "ais_details_open";
function loadDetailsOpen(): boolean {
  try { return localStorage.getItem(DETAILS_KEY) !== "0"; } catch { return true; }
}
function saveDetailsOpen(v: boolean) {
  try { localStorage.setItem(DETAILS_KEY, v ? "1" : "0"); } catch { /* noop */ }
}

// [F4] Known MOEX (Moscow Exchange) tickers — Yahoo returns no technicalInsights for these.
// Used to show an honest "AI-only technical analysis" badge instead of implying Yahoo data.
const MOEX_TICKERS = new Set([
  "SBER","GAZP","LKOH","NVTK","ROSN","GMKN","YNDX","VTBR","MTSS","MAGN",
  "ALRS","CHMF","PHOR","TATN","PLZL","POLY","AFLT","RUAL","CBOM","DSKY",
  "FEES","HYDR","IRAO","MOEX","NLMK","OZON","POSI","SGZH","SMLT","TCSG",
  "VKCO","AGRO","SNGS","ENPG","PIKK","FIVE","SFIN","FLOT","BELU","GLTR",
]);
function isMoexTicker(ticker: string): boolean {
  if (!ticker) return false;
  const t = ticker.toUpperCase();
  return t.endsWith(".ME") || MOEX_TICKERS.has(t.replace(".ME", ""));
}

interface Props {
  data: AnalysisData;
  lang: Lang;
  cacheAge?: string | null;
  onRefresh?: () => void;
}

export function AnalysisView({ data, lang, cacheAge, onRefresh }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const ru = lang !== "en";
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [detailsOpen, setDetailsOpen] = useState<boolean>(loadDetailsOpen);
  const toggleDetails = useCallback(() => setDetailsOpen(prev => { saveDetailsOpen(!prev); return !prev; }), []);
  const toggle = useCallback((n: number) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(n) ? next.delete(n) : next.add(n);
    return next;
  }), []);

  const aC = ACTC[n(data.recommendation?.action) as keyof typeof ACTC] ?? ACTC.watch;
  const rC = RISKC[n(data.riskProfile?.score) as keyof typeof RISKC] ?? RISKC.medium;
  const kP = KWAVEC[n(data.kondratiev?.currentPhase) as keyof typeof KWAVEC] ?? KWAVEC.autumn;
  const mC = MACROC[n(data.macro?.macroScore) as keyof typeof MACROC] ?? MACROC.neutral;

  const actL = { buy: t("aB"), hold: t("aH"), sell: t("aS2"), watch: t("aW") }[n(data.recommendation?.action)] ?? t("aW");
  const rLbl = t({ low: "rL", medium: "rM", high: "rH" }[n(data.riskProfile?.score)] ?? "rM");
  const kLbl = t({ spring: "kSp", summer: "kSu", autumn: "kAu", winter: "kWi" }[n(data.kondratiev?.currentPhase)] ?? "kAu");
  const mLbl = { bullish: t("mBu"), neutral: t("mNe"), bearish: t("mBe") }[n(data.macro?.macroScore)] ?? data.macro?.macroScore ?? "—";

  const moex = isMoexTicker(data.asset?.ticker ?? "");

  let sn = 0;
  const nextSn = () => ++sn;

  return (
    <div style={{ animation: "fadeUp 0.5s ease both" }}>
      {/* Stale data banner */}
      {cacheAge && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#aaa", fontSize: 11, fontFamily: "monospace" }}>
            🕐 {t("staleData")} · {cacheAge}
          </span>
          {onRefresh && (
            <button onClick={onRefresh} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, padding: "4px 12px", color: "#c9a84c", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}>
              {t("staleRefresh")} →
            </button>
          )}
        </div>
      )}
      {/* AI SIGNAL BANNER */}
      <div style={{ background: aC.bg, border: `1px solid ${aC.br}33`, borderLeft: `3px solid ${aC.br}`, borderRadius: 10, padding: "18px 24px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "var(--text3)", fontSize: 10, letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: 4 }}>
            {t("rec")} · {(data.recommendation?.timeHorizon || "").split(" ")[0]}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: aC.c }}>{actL}</div>
          <div style={{ color: aC.c, fontSize: 11, fontFamily: "monospace", opacity: .7, marginTop: 4 }}>
            {t("confLbl")} {t({ high: "confH", medium: "confM", low: "confL" }[n(data.recommendation?.confidence)] ?? "confM")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          {[[mC.c, t("macLbl"), mLbl], [rC.c, t("rkLbl"), rLbl], [kP.c, t("konLbl"), kLbl]].map(([color, lbl, val]) => (
            <div key={String(lbl)} style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{String(lbl)}</div>
              <div style={{ color: String(color), fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{String(val)}</div>
            </div>
          ))}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{t("assetLbl")}</div>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{data.asset?.ticker}</div>
            <Tag>{data.asset?.type}</Tag>
          </div>
        </div>
      </div>

      {data.dataAsOf && (
        <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>
          {t("dataAsOf")} {data.dataAsOf}
        </div>
      )}

      {/* Data quality disclosure */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
        <span style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 12, padding: "2px 10px", color: "#00d084", fontSize: 9, fontFamily: "monospace" }}>
          📊 {ru ? "Цена · P/E · бета · выручка — Yahoo Finance" : "Price · P/E · beta · revenue — Yahoo Finance"}
        </span>
        {moex ? (
          <span style={{ background: "rgba(255,122,61,0.08)", border: "1px solid rgba(255,122,61,0.25)", borderRadius: 12, padding: "2px 10px", color: "#ff7a3d", fontSize: 9, fontFamily: "monospace" }}>
            ⚠ {ru ? "Техн. анализ (MOEX) — только AI-оценка, без биржевых данных в реальном времени" : "Technical analysis (MOEX) — AI estimate only, no real-time exchange data"}
          </span>
        ) : data._meta?.hasRealTA ? (
          <span style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 12, padding: "2px 10px", color: "#00d084", fontSize: 9, fontFamily: "monospace" }}>
            📐 {ru ? "RSI(14) · SMA(50/200) · Pivot S1/R1 — расчёт из исторических котировок" : "RSI(14) · SMA(50/200) · Pivot S1/R1 — calculated from historical prices"}
          </span>
        ) : (
          <span style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 12, padding: "2px 10px", color: "#8b9cf7", fontSize: 9, fontFamily: "monospace" }}>
            🤖 {ru ? "RSI · уровни · новости · сентимент — AI-оценка" : "RSI · levels · news · sentiment — AI estimate"}
          </span>
        )}
      </div>

      {/* SECTIONS 01–02 side by side */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {(() => { const s1 = nextSn(); return <AssetInfo data={data} lang={lang} sectionNum={s1} collapsed={collapsed.has(s1)} onToggle={() => toggle(s1)} />; })()}
        {(() => { const s2 = nextSn(); return <Valuation data={data} lang={lang} sectionNum={s2} collapsed={collapsed.has(s2)} onToggle={() => toggle(s2)} />; })()}
      </div>

      {/* Accordion toggle — "Detailed analysis" */}
      <button
        onClick={toggleDetails}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10,
          padding: "12px 18px", cursor: "pointer", marginBottom: 12,
          color: "var(--text2)", fontSize: 13, fontFamily: "monospace", fontWeight: 600,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}
      >
        <span style={{ color: "#c9a84c", fontSize: 14 }}>{detailsOpen ? "▲" : "▼"}</span>
        {ru ? "Подробный анализ" : "Detailed analysis"}
        <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 10 }}>
          {detailsOpen ? (ru ? "свернуть" : "collapse") : (ru ? "развернуть" : "expand")}
        </span>
      </button>

      {detailsOpen && (
        <>
          {(() => { const s = nextSn(); return <TrendAnalysis data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <Kondratiev data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <MacroBackground data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <Technical data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <Sentiment data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <Historical data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <Growth data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <MarketHeat data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <RiskProfile data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <CryptoMetrics data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          {(() => { const s = nextSn(); return <ActionPlan data={data} lang={lang} sectionNum={s} collapsed={collapsed.has(s)} onToggle={() => toggle(s)} />; })()}
          <Sources data={data} lang={lang} />
        </>
      )}

      {/* Legal disclaimer */}
      <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 8, borderLeft: "2px solid rgba(255,165,0,0.5)" }}>
        <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace", lineHeight: 1.6 }}>
          ⚠ {t("disclaimer")}
        </span>
      </div>
    </div>
  );
}
