import { AnalysisData, Lang } from "@/types";
import { RISKC, MACROC, IMP } from "@/constants/colors";
import { n } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, Tag, DateBadge } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function MacroBackground({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const m = data.macro;
  if (!m) return null;
  const mC = MACROC[n(m.macroScore) as keyof typeof MACROC] ?? MACROC.neutral;
  const mLbl = { bullish: t("mBu"), neutral: t("mNe"), bearish: t("mBe") }[n(m.macroScore)] ?? m.macroScore;
  const trendLabel = (v: string) => ({ rising: t("rUp"), falling: t("rDown"), stable: t("rFlat") }[n(v)] ?? "");

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s05")} collapsed={collapsed} onToggle={onToggle} titleColor="#8b9cf7" style={{ marginBottom: 12, border: "1px solid rgba(139,156,247,0.2)" }} badge={<><Tag color={mC.c}>{mLbl}</Tag><DateBadge date={m.dataAsOf} /></>}>
      <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{m.globalContext}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginBottom: 14 }}>
        {m.interestRates?.fedRate && (
          <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{t("fedR")}</div>
            <div style={{ color: "#ddd8cc", fontSize: 16, fontFamily: "monospace", fontWeight: 600 }}>{m.interestRates.fedRate}</div>
            <div style={{ color: { rising: "#ff4d4d", falling: "#00d084", stable: "#f5a623" }[n(m.interestRates.trend)] ?? "#f5a623", fontSize: 11, marginTop: 4 }}>{trendLabel(m.interestRates.trend)}</div>
            {m.interestRates.impactNote && <div style={{ color: "#444456", fontSize: 10, marginTop: 4 }}>{m.interestRates.impactNote}</div>}
          </div>
        )}
        {m.inflation?.usCPI && (
          <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{t("inflLbl")}</div>
            <div style={{ color: "#ddd8cc", fontSize: 16, fontFamily: "monospace", fontWeight: 600 }}>{m.inflation.usCPI}</div>
            <div style={{ color: { rising: "#ff4d4d", falling: "#00d084", stable: "#f5a623" }[n(m.inflation.trend)] ?? "#f5a623", fontSize: 11, marginTop: 4 }}>{trendLabel(m.inflation.trend)}</div>
          </div>
        )}
        {m.recession?.probability && (
          <div style={{ background: "var(--border2)", border: `1px solid ${RISKC[n(m.recession.probability) as keyof typeof RISKC]?.c ?? "#f5a623"}25`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{t("recLbl")}</div>
            <div style={{ color: RISKC[n(m.recession.probability) as keyof typeof RISKC]?.c ?? "#f5a623", fontSize: 14, fontWeight: 700 }}>
              {t({ low: "rL", medium: "rM", high: "rH" }[n(m.recession.probability)] ?? "rM")}
            </div>
            {m.recession.note && <div style={{ color: "#444456", fontSize: 10, marginTop: 4 }}>{m.recession.note}</div>}
          </div>
        )}
        {(m.commodities?.oil || m.commodities?.gold) && (
          <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("commLbl")}</div>
            {m.commodities.oil && <div style={{ color: "#ff8c42", fontSize: 12, fontFamily: "monospace" }}>🛢 {m.commodities.oil}</div>}
            {m.commodities.gold && <div style={{ color: "#c9a84c", fontSize: 12, fontFamily: "monospace", marginTop: 4 }}>🥇 {m.commodities.gold}</div>}
          </div>
        )}
      </div>
      {m.geopolitics?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("geopLbl")}</div>
          {m.geopolitics.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 12px", background: "var(--border2)", borderRadius: 6, borderLeft: `2px solid ${IMP[g.impact] || "#555568"}`, marginBottom: 6 }}>
              <div style={{ minWidth: 60 }}>
                <div style={{ color: "#c9a84c", fontSize: 10, fontFamily: "monospace" }}>{g.date}</div>
                <Tag color={{ high: "#ff4d4d", medium: "#f5a623", low: "#555568" }[n(g.relevance)] ?? "#555568"}>{g.relevance}</Tag>
              </div>
              <div style={{ color: "#777788", fontSize: 12, lineHeight: 1.5 }}>{g.event}</div>
            </div>
          ))}
        </div>
      )}
      {m.newsBackground?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("newsLbl")}</div>
          {m.newsBackground.map((nw, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "var(--border2)", borderRadius: 8, borderLeft: `2px solid ${IMP[nw.sentiment] || "#555568"}`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div style={{ color: "#ccccdd", fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{nw.title}</div>
                <Tag color={IMP[nw.sentiment] || "#555568"}>{nw.sentiment === "positive" ? "▲" : nw.sentiment === "negative" ? "▼" : "●"}</Tag>
              </div>
              <p style={{ color: "#666678", fontSize: 11, lineHeight: 1.5, marginBottom: 4 }}>{nw.summary}</p>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{nw.source} · {nw.date}</div>
            </div>
          ))}
        </div>
      )}
      {m.macroConclusion && (
        <p style={{ color: "#aaa8b8", fontSize: 13, lineHeight: 1.6, padding: "8px 14px", background: "rgba(139,156,247,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(139,156,247,0.3)" }}>
          {m.macroConclusion}
        </p>
      )}
    </SectionBlock>
  );
}
