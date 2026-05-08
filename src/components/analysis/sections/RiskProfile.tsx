import { AnalysisData, Lang } from "@/types";
import { RISKC } from "@/constants/colors";
import { n, fmtMaybe } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, MetricBox, Tag } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function RiskProfile({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const r = data.riskProfile;
  if (!r) return null;
  const rC = RISKC[n(r.score) as keyof typeof RISKC] ?? RISKC.medium;
  const rLbl = t({ low: "rL", medium: "rM", high: "rH" }[n(r.score)] ?? "rM");

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s11")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 12 }}>
        <MetricBox label={t("oRisk")} value={rLbl} accent={rC.c} />
        <MetricBox label={t("dside")} value={fmtMaybe(r.downsideRisk) || "—"} accent="#ff4d4d" />
        <MetricBox label={t("vol")} value={t({ low: "vL", medium: "vM", high: "vH" }[n(r.volatility)] ?? "vM")} accent={RISKC[n(r.volatility) as keyof typeof RISKC]?.c} />
        <MetricBox label={t("liq")} value={t({ high: "lH", medium: "lM", low: "lLo" }[n(r.liquidity)] ?? "lM")} />
        <MetricBox
          label={t("dbt")}
          value={t({ low: "dL", medium: "dM", high: "dH", critical: "dC" }[n(r.debtLevel)] ?? "dM")}
          accent={n(r.debtLevel) === "critical" ? "#ff4d4d" : undefined}
        />
        <MetricBox label={t("geoR")} value={t({ low: "rL", medium: "rM", high: "rH" }[n(r.geopoliticalRisk)] ?? "rM")} />
      </div>
      {r.factors?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {r.factors.map((f, i) => <Tag key={i} color="#ff4d4d">{f}</Tag>)}
        </div>
      )}
    </SectionBlock>
  );
}
