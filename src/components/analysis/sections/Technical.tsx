import { AnalysisData, Lang } from "@/types";
import { TRENDC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, Tag, MetricBox } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function Technical({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const tech = data.technical;
  if (!tech) return null;
  const tC = TRENDC[n(tech.trend) as keyof typeof TRENDC] ?? TRENDC.sideways;
  const cur = data.valuation?.currency || "$";

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s06")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 14 }}>
        <div style={{ background: "var(--border2)", border: `1px solid ${tC.c}30`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("trendLbl")}</div>
          <div style={{ color: tC.c, fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>
            {t({ bullish: "tB", bearish: "tBe", sideways: "tS" }[n(tech.trend)] ?? "tS")}
          </div>
          <div style={{ color: "#444456", fontSize: 10, marginTop: 3 }}>
            {t({ strong: "tSt", moderate: "tMo", weak: "tWe" }[n(tech.trendStrength)] ?? "tMo")}
          </div>
        </div>
        {tech.rsi != null && (
          <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("rsiLbl")}</div>
            <div style={{ color: { overbought: "#ff4d4d", oversold: "#00d084", normal: "#f5a623" }[n(tech.rsiStatus)] ?? "#f5a623", fontSize: 18, fontFamily: "monospace", fontWeight: 600 }}>
              {tech.rsi}
            </div>
            <div style={{ color: "#444456", fontSize: 10, marginTop: 3 }}>
              {t({ overbought: "rsiO", oversold: "rsiU", normal: "rsiN" }[n(tech.rsiStatus)] ?? "rsiN")}
            </div>
          </div>
        )}
        {tech.supportLevel != null && <MetricBox label={t("supLbl")} value={`${cur}${fmt(tech.supportLevel)}`} accent="#00d084" />}
        {tech.resistanceLevel != null && <MetricBox label={t("resLbl")} value={`${cur}${fmt(tech.resistanceLevel)}`} accent="#ff4d4d" />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          {[
            [t("bsLbl"), tech.buySignal, { yes: t("sY"), watch: t("sW"), no: t("sN") }, { yes: "#00d084", watch: "#f5a623", no: "#ff4d4d" }],
            [t("ssLbl"), tech.sellSignal, { yes: t("ssY"), watch: t("sW"), no: t("ssN") }, { yes: "#ff4d4d", watch: "#f5a623", no: "#00d084" }],
            [t("accLbl"), tech.accumulationPhase ? "yes" : "no", { yes: t("accY"), no: t("accN") }, { yes: "#00d084", no: "#555568" }],
          ].map(([lbl, val, labels, colors]) => (
            <div key={String(lbl)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: "#666678", fontSize: 12 }}>{String(lbl)}</span>
              <Tag color={(colors as Record<string, string>)[n(String(val))] ?? "#555568"}>
                {(labels as Record<string, string>)[n(String(val))] ?? String(val)}
              </Tag>
            </div>
          ))}
        </div>
        <div>
          {[
            [t("instLbl"), tech.institutionalActivity, { accumulating: t("iB"), distributing: t("iS"), neutral: t("iN") }, { accumulating: "#00d084", distributing: "#ff4d4d", neutral: "#f5a623" }],
            [t("volLbl"), tech.volumeTrend, { increasing: t("vU"), decreasing: t("vD"), neutral: t("vF") }, { increasing: "#00d084", decreasing: "#ff4d4d", neutral: "#f5a623" }],
          ].map(([lbl, val, labels, colors]) => (
            <div key={String(lbl)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: "#666678", fontSize: 12 }}>{String(lbl)}</span>
              <Tag color={(colors as Record<string, string>)[n(String(val))] ?? "#555568"}>
                {(labels as Record<string, string>)[n(String(val))] ?? String(val)}
              </Tag>
            </div>
          ))}
        </div>
      </div>
      {tech.technicalNote && (
        <p style={{ color: "#555568", fontSize: 12, lineHeight: 1.5, fontStyle: "italic", marginTop: 10 }}>{tech.technicalNote}</p>
      )}
    </SectionBlock>
  );
}
