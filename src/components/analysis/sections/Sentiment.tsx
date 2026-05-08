import { AnalysisData, Lang } from "@/types";
import { n, clamp, fgColor } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function Sentiment({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const s = data.sentiment;
  if (!s) return null;

  const rows = [
    [t("sLbl"), { bullish: t("sBu"), bearish: t("sBe"), neutral: t("sNe") }[n(s.overall)], { bullish: "#00d084", bearish: "#ff4d4d", neutral: "#f5a623" }[n(s.overall)]],
    [t("hLbl"), { extreme: t("hEx"), high: t("hHi"), medium: t("hMe"), low: t("hLo") }[n(s.hypeIndex)], { extreme: "#ff4d4d", high: "#ff8c42", medium: "#f5a623", low: "#00d084" }[n(s.hypeIndex)]],
    [t("iLbl"), { inflow: t("iIn"), outflow: t("iOu"), neutral: t("iNe") }[n(s.institutionalFlow)], { inflow: "#00d084", outflow: "#ff4d4d", neutral: "#f5a623" }[n(s.institutionalFlow)]],
    [t("wLbl"), { accumulating: t("wBu"), selling: t("wSe"), neutral: t("wNe") }[n(s.whaleActivity)], { accumulating: "#00d084", selling: "#ff4d4d", neutral: "#f5a623" }[n(s.whaleActivity)]],
  ];

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s07")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {s.fearGreedValue != null && (
          <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>{t("fgTitle")}</div>
            <div style={{ height: 6, background: "linear-gradient(90deg,#ff4d4d,#ff8c42,#f5a623,#00d084)", borderRadius: 3, marginBottom: 8, position: "relative" }}>
              <div style={{ position: "absolute", top: -3, left: `${clamp(s.fearGreedValue, 2, 98)}%`, transform: "translateX(-50%)", width: 12, height: 12, borderRadius: "50%", background: fgColor(s.fearGreedValue), border: "2px solid var(--bg)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#ff4d4d", fontSize: 9, fontFamily: "monospace" }}>{t("fg0")}</span>
              <span style={{ color: "#00d084", fontSize: 9, fontFamily: "monospace" }}>{t("fg100")}</span>
            </div>
            <div style={{ color: fgColor(s.fearGreedValue), fontSize: 16, fontFamily: "monospace", fontWeight: 700 }}>
              {s.fearGreedValue} — {t({ "extreme fear": "fgEF", fear: "fgF", neutral: "fgN", greed: "fgG", "extreme greed": "fgEG" }[n(s.fearGreedLabel)] ?? "fgN")}
            </div>
          </div>
        )}
        <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "14px" }}>
          <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>{t("csTitle")}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[["accumulation", t("cAcc")], ["markup", t("cMu")], ["distribution", t("cDi")], ["markdown", t("cMa")]].map(([stage, lbl]) => (
              <div key={stage} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", background: n(s.marketCycleStage) === stage ? "var(--border)" : "var(--border2)", border: `1px solid ${n(s.marketCycleStage) === stage ? "rgba(201,168,76,0.5)" : "var(--border2)"}`, color: n(s.marketCycleStage) === stage ? "#c9a84c" : "var(--text3)" }}>
                {lbl}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
        {rows.map(([lbl, val, col]) => (
          <div key={String(lbl)} style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{String(lbl)}</div>
            <div style={{ color: String(col) || "#ddd8cc", fontSize: 13, fontWeight: 700 }}>{String(val) || "—"}</div>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}
