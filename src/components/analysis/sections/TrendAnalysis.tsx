import { AnalysisData, Lang } from "@/types";
import { IMP } from "@/constants/colors";
import { n, fmt, fmtMaybe } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, MetricBox, Tag, DateBadge } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function TrendAnalysis({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const ta = data.trendAnalysis;
  if (!ta) return null;
  const cur = data.valuation?.currency || "$";
  const isCrypto = data.asset?.assetClass === "crypto";
  const naLabel = lang === "ru" ? "Н/П" : "N/A";
  const naSub = lang === "ru" ? "не применимо для крипто" : "not applicable for crypto";

  const prices = [
    [ta.price3y, t("y3"), ta.price3yDate, ta.return3y, "#c9a84c"],
    [ta.price5y, t("y5"), ta.price5yDate, ta.return5y, "#8b9cf7"],
    [ta.price10y, t("y10"), ta.price10yDate, ta.return10y, "#00d4aa"],
  ].filter(([p]) => p != null);

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s03")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }} badge={<DateBadge date={ta.dataAsOf} />}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 14 }}>
        {prices.map(([p, lbl, dt, ret, col]) => (
          <div key={String(lbl)} style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{String(lbl)}</div>
            <div style={{ color: "#ddd8cc", fontSize: 15, fontFamily: "monospace", fontWeight: 600 }}>{cur}{fmt(Number(p))}</div>
            <div style={{ color: "#444456", fontSize: 10, marginTop: 3 }}>{String(dt)}</div>
            {ret && <div style={{ color: String(col), fontSize: 13, fontFamily: "monospace", fontWeight: 700, marginTop: 6 }}>{String(ret)}</div>}
          </div>
        ))}
        {isCrypto
          ? <MetricBox label={t("cagr")} value={naLabel} sub={naSub} accent="#444456" />
          : fmtMaybe(ta.revenueCAGR5y)
            ? <MetricBox label={t("cagr")} value={fmtMaybe(ta.revenueCAGR5y)!} accent="#00d084" />
            : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 14 }}>
        {isCrypto ? (<>
          <MetricBox label={t("r3")} value={naLabel} sub={naSub} accent="#444456" />
          <MetricBox label={t("r5")} value={naLabel} sub={naSub} accent="#444456" />
          <MetricBox label={t("r10")} value={naLabel} sub={naSub} accent="#444456" />
        </>) : (<>
          {fmtMaybe(ta.revenue3y) && <MetricBox label={t("r3")} value={fmtMaybe(ta.revenue3y)!} />}
          {fmtMaybe(ta.revenue5y) && <MetricBox label={t("r5")} value={fmtMaybe(ta.revenue5y)!} />}
          {fmtMaybe(ta.revenue10y) && <MetricBox label={t("r10")} value={fmtMaybe(ta.revenue10y)!} />}
        </>)}
        {ta.profitTrend && (
          <MetricBox
            label={t("ptLabel")}
            value={{ growing: t("ptGrow"), stable: t("ptStable"), declining: t("ptDecline") }[n(ta.profitTrend)] ?? ta.profitTrend}
            accent={{ growing: "#00d084", stable: "#f5a623", declining: "#ff4d4d" }[n(ta.profitTrend)]}
          />
        )}
      </div>
      {ta.keyMilestones?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("miles")}</div>
          {ta.keyMilestones.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 12px", background: "var(--border2)", borderRadius: 6, borderLeft: `2px solid ${IMP[m.impact] || "#555568"}`, marginBottom: 6 }}>
              <div style={{ color: "#c9a84c", fontFamily: "monospace", fontSize: 11, minWidth: 36 }}>{m.year}</div>
              <div style={{ color: "#777788", fontSize: 12, lineHeight: 1.5, flex: 1 }}>{m.event}</div>
              <Tag color={IMP[m.impact] || "#555568"}>{m.impact === "positive" ? "▲" : m.impact === "negative" ? "▼" : "●"}</Tag>
            </div>
          ))}
        </div>
      )}
      {ta.trendConclusion && (
        <p style={{ color: "#aaa8b8", fontSize: 13, lineHeight: 1.6, fontStyle: "italic", padding: "10px 14px", background: "rgba(201,168,76,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(201,168,76,0.3)" }}>
          {ta.trendConclusion}
        </p>
      )}
    </SectionBlock>
  );
}
