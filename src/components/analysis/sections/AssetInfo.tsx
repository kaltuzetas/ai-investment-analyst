import { CSSProperties } from "react";
import { AnalysisData, Lang } from "@/types";
import { QUALC, IMP } from "@/constants/colors";
import { n, fmtMaybe } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, Tag, MetricBox } from "@/components/atoms";

interface Props {
  data: AnalysisData;
  lang: Lang;
  sectionNum: number;
  collapsed?: boolean;
  onToggle?: () => void;
  style?: CSSProperties;
}

export function AssetInfo({ data, lang, sectionNum, collapsed, onToggle, style }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const qC = QUALC[n(data.asset?.quality) as keyof typeof QUALC] ?? QUALC.medium;

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s01")} collapsed={collapsed} onToggle={onToggle} style={style}>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{data.asset?.name}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Tag color={qC.c}>
          {qC.i}{" "}
          {{ strong: lang === "en" ? "Strong" : "Сильный", medium: lang === "en" ? "Medium" : "Средний", weak: lang === "en" ? "Weak" : "Слабый" }[n(data.asset?.quality)] ?? data.asset?.quality}
        </Tag>
        {data.asset?.sector && <Tag color="#6b63ff">{data.asset.sector}</Tag>}
      </div>
      <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{data.asset?.businessModel}</p>
      {data.asset?.moat && (
        <p style={{ color: "var(--text2)", fontSize: 12, fontStyle: "italic", lineHeight: 1.5, marginBottom: 10 }}>
          <span style={{ color: "#c9a84c44" }}>{t("moat")} </span>
          {data.asset.moat}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {fmtMaybe(data.asset?.marketSize) && <MetricBox label={t("tam")} value={fmtMaybe(data.asset?.marketSize)!} accent="#8b9cf7" />}
        {fmtMaybe(data.asset?.industryGrowth) && <MetricBox label={t("ig")} value={fmtMaybe(data.asset?.industryGrowth)!} accent="#00d084" />}
      </div>
      {data.asset?.competitors?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("comp")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {data.asset.competitors.map((c, i) => <Tag key={i} color="#8b9cf7">{c}</Tag>)}
          </div>
        </div>
      )}
      {data.asset?.risks?.length > 0 && (
        <div>
          <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("risks")}</div>
          {data.asset.risks.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "#ff4d4d", fontSize: 10, marginTop: 2 }}>▸</span>
              <span style={{ color: "var(--text2)", fontSize: 12 }}>{r}</span>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  );
}
