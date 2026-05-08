import { useState, useMemo } from "react";
import { Lang, AnalysisData } from "@/types";
import { TR } from "@/constants/translations";
import { ACTC, RISKC, KWAVEC, STATC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { Tag, Spinner } from "@/components/atoms";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getDemoData } from "@/constants/demoData";
import { getFromCache, cacheKey } from "@/hooks/useCache";

interface HalfProps {
  data: AnalysisData | null;
  loading: boolean;
  lang: Lang;
  error?: string | null;
  isDemo?: boolean;
}

function Half({ data: d, loading, lang, error, isDemo }: HalfProps) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  if (loading) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}><Spinner size={32} /></div>;
  if (error) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff7070", fontSize: 12, fontFamily: "monospace", padding: 40, textAlign: "center" }}>⚠ {error}</div>;
  if (!d) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13, fontStyle: "italic", padding: 40 }}>{t("emptySearch")}</div>;

  const aC = ACTC[n(d.recommendation?.action) as keyof typeof ACTC] ?? ACTC.watch;
  const rC = RISKC[n(d.riskProfile?.score) as keyof typeof RISKC] ?? RISKC.medium;
  const kP = KWAVEC[n(d.kondratiev?.currentPhase) as keyof typeof KWAVEC] ?? KWAVEC.autumn;
  const sC = STATC[n(d.valuation?.status) as keyof typeof STATC] ?? STATC.fair;
  const actL = { buy: t("aB"), hold: t("aH"), sell: t("aS2"), watch: t("aW") }[n(d.recommendation?.action)] ?? t("aW");
  const cur = d.valuation?.currency ?? "$";

  const rows: [string, string, string?][] = [
    [t("nowLbl"),    d.valuation?.currentPrice != null ? `${cur}${fmt(d.valuation.currentPrice)}` : "—", undefined],
    [t("fairLbl"),   d.valuation?.fairPrice     != null ? `${cur}${fmt(d.valuation.fairPrice)}`    : "—", sC.c],
    [t("growthPot"), d.valuation?.growthPotential != null ? `${d.valuation.growthPotential > 0 ? "+" : ""}${d.valuation.growthPotential.toFixed(1)}%` : "—", d.valuation?.growthPotential != null && d.valuation.growthPotential > 0 ? "#00d084" : "#ff4d4d"],
    [t("rkLbl"),     t({ low: "rL", medium: "rM", high: "rH" }[n(d.riskProfile?.score)] ?? "rM"), rC.c],
    [t("konLbl"),    t({ spring: "kSp", summer: "kSu", autumn: "kAu", winter: "kWi" }[n(d.kondratiev?.currentPhase)] ?? "kAu"), kP.c],
    [t("confLbl").replace(":",""), t({ high: "confH", medium: "confM", low: "confL" }[n(d.recommendation?.confidence)] ?? "confM"), undefined],
    ["P/E",          d.valuation?.metrics?.pe != null ? String(d.valuation.metrics.pe) : "—", undefined],
    ["EV/EBITDA",    d.valuation?.metrics?.evEbitda != null ? String(d.valuation.metrics.evEbitda) : "—", undefined],
  ];

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ background: aC.bg, border: `1px solid ${aC.br}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{d.asset?.type}</div>
          {isDemo && <span style={{ color: "#444456", fontSize: 8, fontFamily: "monospace", border: "1px solid #333348", borderRadius: 3, padding: "1px 5px" }}>DEMO</span>}
        </div>
        <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 700, color: "var(--text)" }}>{d.asset?.ticker}</div>
        <div style={{ color: "#666678", fontSize: 12, marginBottom: 8 }}>{d.asset?.name}</div>
        <Tag color={aC.c}>{actL}</Tag>
      </div>

      {/* Metrics table */}
      <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, overflow: "hidden" }}>
        {rows.map(([lbl, val, color], i) => (
          <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderBottom: i < rows.length - 1 ? "1px solid var(--border2)" : "none" }}>
            <span style={{ color: "#444456", fontSize: 11, fontFamily: "monospace" }}>{lbl}</span>
            <span style={{ color: color ?? "var(--text)", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {d.recommendation?.summary && (
        <p style={{ color: "#555568", fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: "10px 14px", background: "var(--border2)", borderRadius: 8, borderLeft: "2px solid rgba(201,168,76,0.25)" }}>
          {d.recommendation.summary}
        </p>
      )}

      <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 7, borderLeft: "2px solid rgba(255,165,0,0.5)" }}>
        <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace", lineHeight: 1.6 }}>
          ⚠ {t("disclaimer")}
        </span>
      </div>
    </div>
  );
}

interface Props {
  lang: Lang;
  userId?: string;
  analyze1: (q: string) => void;
  analyze2: (q: string) => void;
  setResult1: (d: AnalysisData | null) => void;
  setResult2: (d: AnalysisData | null) => void;
  result1: AnalysisData | null;
  result2: AnalysisData | null;
  loading1: boolean;
  loading2: boolean;
  error1?: string | null;
  error2?: string | null;
}

const QUICK_PAIRS = [
  ["AAPL", "MSFT"],
  ["NVDA", "TSLA"],
  ["BTC",  "ETH" ],
  ["SPY",  "QQQ" ],
  ["SBER", "LKOH"],
];

export function CompareView({ lang, userId, analyze1, analyze2, setResult1, setResult2, result1, result2, loading1, loading2, error1, error2 }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [demo1, setDemo1] = useState(false);
  const [demo2, setDemo2] = useState(false);
  const isMobile = useIsMobile();
  const demoData = useMemo(() => getDemoData(lang), [lang]);

  const inp = { background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px", color: "var(--text)", fontSize: 14, fontFamily: "monospace", width: "100%", outline: "none" };

  const loadSide = (
    ticker: string,
    setQ: (v: string) => void,
    analyze: (q: string) => void,
    setResult: (d: AnalysisData | null) => void,
    setIsDemo: (v: boolean) => void,
  ) => {
    setQ(ticker);
    setIsDemo(false);
    const cached = getFromCache(cacheKey(ticker, lang, userId)) ?? getFromCache(cacheKey(ticker, lang));
    if (cached?.data) { setResult(cached.data); return; }
    const demo = demoData[ticker];
    if (demo) { setResult(demo); setIsDemo(true); return; }
    analyze(ticker);
  };

  return (
    <div>
      <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace", marginBottom: 16 }}>{t("cmpTitle")}</div>

      {/* Quick pairs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
          {lang === "ru" ? "Быстрые пары:" : "Quick pairs:"}
        </span>
        {QUICK_PAIRS.map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            onClick={() => {
              loadSide(a, setQ1, analyze1, setResult1, setDemo1);
              loadSide(b, setQ2, analyze2, setResult2, setDemo2);
            }}
            style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "3px 12px", color: "#c9a84c88", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
          >
            {a} vs {b}
          </button>
        ))}
      </div>

      {/* Search row */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, marginBottom: 24, alignItems: isMobile ? "stretch" : "center" }}>
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          <input value={q1} onChange={e => setQ1(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setDemo1(false); analyze1(q1); } }} placeholder={t("cmpSearch1")} style={inp} />
          <button onClick={() => { setDemo1(false); analyze1(q1); }} disabled={loading1 || !q1.trim()} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 8, padding: "9px 14px", color: "var(--bg)", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}>
            {loading1 ? <Spinner size={14} /> : "→"}
          </button>
        </div>
        <div style={{ color: "var(--text3)", fontFamily: "monospace", fontSize: 14, textAlign: "center", padding: isMobile ? "2px 0" : "0 4px" }}>{t("cmpVs")}</div>
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          <input value={q2} onChange={e => setQ2(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setDemo2(false); analyze2(q2); } }} placeholder={t("cmpSearch2")} style={inp} />
          <button onClick={() => { setDemo2(false); analyze2(q2); }} disabled={loading2 || !q2.trim()} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 8, padding: "9px 14px", color: "var(--bg)", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}>
            {loading2 ? <Spinner size={14} /> : "→"}
          </button>
        </div>
      </div>

      {!result1 && !result2 && !loading1 && !loading2 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text3)", fontSize: 13, fontStyle: "italic" }}>{t("cmpEmpty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, alignItems: "flex-start" }}>
          <Half data={result1} loading={loading1} lang={lang} error={error1} isDemo={demo1} />
          {!isMobile && <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", flexShrink: 0 }} />}
          {isMobile && <div style={{ height: 1, background: "var(--border)", width: "100%" }} />}
          <Half data={result2} loading={loading2} lang={lang} error={error2} isDemo={demo2} />
        </div>
      )}
    </div>
  );
}
