import { AnalysisData, Lang } from "@/types";
import { CYCLEC } from "@/constants/colors";
import { n, fmt, clamp } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, MetricBox } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function Historical({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const h = data.historical;
  if (!h) return null;
  const cyC = CYCLEC[n(h.cyclePosition) as keyof typeof CYCLEC] ?? CYCLEC.mid;
  const cur = data.valuation?.currency || "$";

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s08")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 14 }}>
        {h.ath != null && <MetricBox label={t("ath")} value={`${cur}${fmt(h.ath)}`} sub={h.athDate} accent="#c9a84c" />}
        {h.atl != null && <MetricBox label={t("atl")} value={`${cur}${fmt(h.atl)}`} sub={h.atlDate} accent="#8b9cf7" />}
        {h.maxDrawdown && <MetricBox label={t("mdd")} value={h.maxDrawdown} accent="#ff4d4d" />}
        {h.avgRecoveryMonths != null && <MetricBox label={t("rec2")} value={`~${h.avgRecoveryMonths} ${t("recU")}`} />}
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--border2)", marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${clamp(cyC.p)}%`, background: `linear-gradient(90deg,#8b9cf7,${cyC.c})`, borderRadius: 3 }} />
      </div>
      {h.crisisBehavior && <p style={{ color: "#666678", fontSize: 12, lineHeight: 1.5 }}>{h.crisisBehavior}</p>}
    </SectionBlock>
  );
}
