import { AnalysisData, Lang } from "@/types";
import { TR } from "@/constants/translations";
import { fmtMaybe } from "@/utils/format";
import { SectionBlock, MetricBox, Tag } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function CryptoMetrics({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const cm = data.cryptoMetrics;
  if (!cm || data.asset?.assetClass !== "crypto") return null;
  const naLabel = lang === "ru" ? "Н/П" : "N/A";
  const naSub = lang === "ru" ? "не применимо" : "not applicable";
  const isNA = (v: string | null | undefined) => !v || v === "N/A" || v === "—";

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s12")} collapsed={collapsed} onToggle={onToggle} titleColor="#00d4aa" style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 14 }}>
        {fmtMaybe(cm.activeAddresses) && <MetricBox label={t("aA")} value={fmtMaybe(cm.activeAddresses)!} accent="#00d4aa" />}
        {fmtMaybe(cm.transactions) && <MetricBox label={t("tD")} value={fmtMaybe(cm.transactions)!} />}
        {fmtMaybe(cm.tvl) && <MetricBox label={t("tvl")} value={fmtMaybe(cm.tvl)!} accent="#8b5cf6" />}
        {cm.nvt != null && fmtMaybe(String(cm.nvt)) && <MetricBox label={t("nvt")} value={fmtMaybe(String(cm.nvt))!} />}
        {isNA(cm.stakingYield)
          ? <MetricBox label={t("sApy")} value={naLabel} sub={naSub} accent="#444456" />
          : <MetricBox label={t("sApy")} value={cm.stakingYield!} accent="#c9a84c" />}
        {cm.adoptionScore != null && <MetricBox label={t("aS")} value={`${cm.adoptionScore}/100`} accent="#00d4aa" />}
      </div>
      {cm.tokenomics && (
        <div>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("tok")}</div>
          <p style={{ color: "#666678", fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{cm.tokenomics}</p>
        </div>
      )}
      {cm.ecosystem?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cm.ecosystem.map((e, i) => <Tag key={i} color="#00d4aa">{e}</Tag>)}
        </div>
      )}
    </SectionBlock>
  );
}
