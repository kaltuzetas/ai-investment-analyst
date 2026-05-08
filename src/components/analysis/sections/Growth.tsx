import { AnalysisData, Lang } from "@/types";
import { TR } from "@/constants/translations";
import { fmtMaybe } from "@/utils/format";
import { SectionBlock, MetricBox, Tag } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function Growth({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const g = data.growth;
  if (!g) return null;
  const isCrypto = data.asset?.assetClass === "crypto";
  const naLabel = lang === "ru" ? "Н/П" : "N/A";
  const naSub = lang === "ru" ? "не применимо для крипто" : "not applicable for crypto";
  const isNA = (v: string | null | undefined) => !v || v === "N/A" || v === "—";

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s09")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 14 }}>
        {isCrypto && isNA(g.revenueGrowthYoY)
          ? <MetricBox label={t("ryoy")} value={naLabel} sub={naSub} accent="#444456" />
          : fmtMaybe(g.revenueGrowthYoY) ? <MetricBox label={t("ryoy")} value={fmtMaybe(g.revenueGrowthYoY)!} accent="#00d084" /> : null}
        {isCrypto && isNA(g.profitGrowthYoY)
          ? <MetricBox label={t("pyoy")} value={naLabel} sub={naSub} accent="#444456" />
          : fmtMaybe(g.profitGrowthYoY) ? <MetricBox label={t("pyoy")} value={fmtMaybe(g.profitGrowthYoY)!} accent="#00d084" /> : null}
        {fmtMaybe(g.userGrowth) && <MetricBox label={t("ug")} value={fmtMaybe(g.userGrowth)!} accent="#4fc3f7" />}
      </div>
      {data.valuation?.canDouble && (
        <div style={{ background: "rgba(0,208,132,0.07)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24 }}>×2</div>
          <div>
            <div style={{ color: "#00d084", fontSize: 13, fontWeight: 700 }}>{t("cd")}</div>
            {data.valuation.canDoubleTimeframe && <div style={{ color: "#00d08488", fontSize: 11, marginTop: 2 }}>{data.valuation.canDoubleTimeframe}</div>}
            {data.valuation.longTermProjection && <div style={{ color: "#555568", fontSize: 12, marginTop: 4 }}>{data.valuation.longTermProjection}</div>}
          </div>
        </div>
      )}
      {g.growthDrivers?.length > 0 && (
        <div>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("gdLabel")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {g.growthDrivers.map((d, i) => <Tag key={i} color="#00d084">{d}</Tag>)}
          </div>
        </div>
      )}
    </SectionBlock>
  );
}
