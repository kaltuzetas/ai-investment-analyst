import { AnalysisData, Lang } from "@/types";
import { KWAVEC } from "@/constants/colors";
import { n } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, Tag, DateBadge } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function Kondratiev({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const k = data.kondratiev;
  if (!k) return null;
  const kP = KWAVEC[n(k.currentPhase) as keyof typeof KWAVEC] ?? KWAVEC.autumn;

  const seasons = [
    ["spring", "🌱", "kSp"],
    ["summer", "☀️", "kSu"],
    ["autumn", "🍂", "kAu"],
    ["winter", "❄️", "kWi"],
  ] as const;

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s04")} collapsed={collapsed} onToggle={onToggle} titleColor={kP.c} style={{ marginBottom: 12, border: `1px solid ${kP.c}25` }} badge={<DateBadge date={k.dataAsOf} />}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {seasons.map(([ph, em, tk]) => {
          const p = KWAVEC[ph];
          const active = n(k.currentPhase) === ph;
          return (
            <div key={ph} style={{ flex: 1, minWidth: 90, padding: "10px 12px", borderRadius: 8, background: active ? `${p.c}15` : "var(--border2)", border: `1px solid ${active ? p.c + "50" : "var(--border2)"}`, textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{em}</div>
              <div style={{ color: active ? p.c : "var(--text3)", fontSize: 11, fontFamily: "monospace", fontWeight: active ? 700 : 400 }}>{t(tk)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: `${kP.c}08`, border: `1px solid ${kP.c}20`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
        <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>{k.phaseDescription}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("techDrv")}</div>
          <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5 }}>{k.waveTechnology}</p>
        </div>
        <div>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("histAn")}</div>
          <p style={{ color: "#666678", fontSize: 12, lineHeight: 1.5, fontStyle: "italic" }}>{k.historicalAnalogy}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {k.opportunityFromCycle && (
          <div style={{ padding: "10px 14px", background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 8 }}>
            <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("opps")}</div>
            <p style={{ color: "#668866", fontSize: 12, lineHeight: 1.5 }}>{k.opportunityFromCycle}</p>
          </div>
        )}
        {k.riskFromCycle && (
          <div style={{ padding: "10px 14px", background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", borderRadius: 8 }}>
            <div style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{t("cRisks")}</div>
            <p style={{ color: "#886678", fontSize: 12, lineHeight: 1.5 }}>{k.riskFromCycle}</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: "#444456", fontSize: 12 }}>{t("fitLbl")}</span>
        <Tag color={{ strong: "#00d084", moderate: "#f5a623", weak: "#ff4d4d" }[n(k.assetFit)] ?? "#f5a623"}>
          {t({ strong: "fitS", moderate: "fitM", weak: "fitW" }[n(k.assetFit)] ?? "fitM")}
        </Tag>
      </div>
      {k.kondratievConclusion && (
        <p style={{ color: "#aaa8b8", fontSize: 13, lineHeight: 1.6, fontStyle: "italic", padding: "10px 14px", background: `${kP.c}06`, borderRadius: 6, borderLeft: `2px solid ${kP.c}40` }}>
          {k.kondratievConclusion}
        </p>
      )}
    </SectionBlock>
  );
}
