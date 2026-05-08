import { AnalysisData, Lang } from "@/types";
import { ACTC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock } from "@/components/atoms";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function ActionPlan({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const aC = ACTC[n(data.recommendation?.action) as keyof typeof ACTC] ?? ACTC.watch;
  const actL = { buy: t("aB"), hold: t("aH"), sell: t("aS2"), watch: t("aW") }[n(data.recommendation?.action)] ?? t("aW");
  const cur = data.valuation?.currency || "USD";
  const { selected: selCur, convert, symbol: selSymbol } = useCurrencyContext();
  const showConverted = selCur !== cur;

  const curP = data.valuation?.currentPrice;
  const buyL = data.recommendation?.buyZoneLow;
  const buyH = data.recommendation?.buyZoneHigh;
  const sellT = data.recommendation?.sellTarget;
  const stopL = data.recommendation?.stopLoss;

  const ps = curP && buyL && buyH ? (curP < buyL ? "below" : curP <= buyH ? "in" : "above") : null;
  const upPct = curP && sellT ? ((sellT - curP) / curP * 100) : null;
  const stPct = curP && stopL ? ((curP - stopL) / curP * 100) : null;

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s13")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ background: aC.bg, border: `1px solid ${aC.br}40`, borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: aC.c, fontSize: 11, fontFamily: "monospace", opacity: .7, marginBottom: 6 }}>{t("rec")}</div>
          <div style={{ color: aC.c, fontSize: 30, fontWeight: 900 }}>{actL}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {data.recommendation?.confidence && (
            <div style={{ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "#444456", fontSize: 9, fontFamily: "monospace", marginBottom: 3 }}>{t("confLbl").replace(":", "")}</div>
              <div style={{ color: "#c9a84c", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>
                {t({ high: "confH", medium: "confM", low: "confL" }[n(data.recommendation.confidence)] ?? "confM")}
              </div>
            </div>
          )}
          {data.recommendation?.timeHorizon && (
            <div style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "#444456", fontSize: 9, fontFamily: "monospace", marginBottom: 3 }}>⏱ {t("hor").toUpperCase()}</div>
              <div style={{ color: "#8b9cf7", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{data.recommendation.timeHorizon}</div>
            </div>
          )}
        </div>
      </div>
      {ps && (
        <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: ps === "above" ? "rgba(255,77,77,0.08)" : "rgba(0,208,132,0.08)", border: `1px solid ${ps === "above" ? "rgba(255,77,77,0.25)" : "rgba(0,208,132,0.25)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#666678", fontSize: 12 }}>{t("cvb")}</span>
          <span style={{ color: ps === "above" ? "#ff4d4d" : "#00d084", fontSize: 12, fontWeight: 700 }}>
            {ps === "above" ? t("abv") : ps === "in" ? t("inz") : t("blw")}
          </span>
        </div>
      )}
      {(buyL || sellT || stopL) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
          {buyL && (
            <div style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.25)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>🎯 {t("bz").toUpperCase()}</div>
              <div style={{ color: "#00d084", fontSize: 20, fontFamily: "monospace", fontWeight: 700 }}>{cur === "USD" ? "$" : cur}{fmt(buyL)}–{fmt(buyH ?? buyL)}</div>
              {showConverted && <div style={{ color: "#00d08466", fontSize: 11, marginTop: 2 }}>{t("curApprox")} {selSymbol}{fmt(convert(buyL, cur))}–{fmt(convert(buyH ?? buyL, cur))}</div>}
              <div style={{ color: "#00d08466", fontSize: 11, marginTop: 4 }}>{t("bzS")}</div>
            </div>
          )}
          {sellT && (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#c9a84c", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>🎯 {t("pt").toUpperCase()}</div>
              <div style={{ color: "#c9a84c", fontSize: 20, fontFamily: "monospace", fontWeight: 700 }}>{cur === "USD" ? "$" : cur}{fmt(sellT)}</div>
              {showConverted && <div style={{ color: "#c9a84c66", fontSize: 11, marginTop: 2 }}>{t("curApprox")} {selSymbol}{fmt(convert(sellT, cur))}</div>}
              <div style={{ color: "#c9a84c66", fontSize: 11, marginTop: 4 }}>{t("ptS")}</div>
            </div>
          )}
          {stopL && (
            <div style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>🛡 {t("sl").toUpperCase()}</div>
              <div style={{ color: "#ff4d4d", fontSize: 20, fontFamily: "monospace", fontWeight: 700 }}>{cur === "USD" ? "$" : cur}{fmt(stopL)}</div>
              {showConverted && <div style={{ color: "#ff4d4d66", fontSize: 11, marginTop: 2 }}>{t("curApprox")} {selSymbol}{fmt(convert(stopL, cur))}</div>}
              <div style={{ color: "#ff4d4d66", fontSize: 11, marginTop: 4 }}>{t("slS")}</div>
            </div>
          )}
        </div>
      )}
      {(upPct != null || stPct != null) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {upPct != null && (
            <div style={{ flex: 1, minWidth: 140, background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#666678", fontSize: 12 }}>{t("ups")}</span>
              <span style={{ color: "#00d084", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>+{upPct.toFixed(1)}%</span>
            </div>
          )}
          {stPct != null && (
            <div style={{ flex: 1, minWidth: 140, background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#666678", fontSize: 12 }}>{t("dp")}</span>
              <span style={{ color: "#ff4d4d", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>↓{stPct.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
      {data.recommendation?.summary && (
        <p style={{ color: "#aaa8b8", fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{data.recommendation.summary}</p>
      )}
      {data.recommendation?.keyPoints?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>{t("kt")}</div>
          {data.recommendation.keyPoints.map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "8px 12px", background: "var(--border2)", borderRadius: 6, borderLeft: "2px solid rgba(201,168,76,0.3)" }}>
              <span style={{ color: "#c9a84c55", fontFamily: "monospace", fontSize: 10, minWidth: 18, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5 }}>{pt}</span>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  );
}
