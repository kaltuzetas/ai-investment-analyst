import { Lang, PortfolioIntelligence as PI } from "@/types";
import { RISKC } from "@/constants/colors";
import { n, clamp } from "@/utils/format";
import { TR } from "@/constants/translations";
import { Block, MetricBox, Tag } from "@/components/atoms";

interface Props { data: PI; lang: Lang; }

export function PortfolioIntelligenceView({ data, lang }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const rC = RISKC[n(data.overallRisk) as keyof typeof RISKC] ?? RISKC.medium;
  const sc = clamp(data.diversificationScore || 0);
  const scC = sc >= 70 ? "#00d084" : sc >= 40 ? "#f5a623" : "#ff4d4d";
  const rLabel = t({ low: "rL", medium: "rM", high: "rH" }[n(data.overallRisk)] ?? "rM");

  return (
    <Block style={{ marginBottom: 16, border: "1px solid rgba(139,156,247,0.25)" }}>
      <div style={{ color: "#8b9cf7", fontSize: 10, letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 14 }}>{t("piTitle")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
        <MetricBox label={t("oRisk")} value={rLabel} accent={rC.c} />
        <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("divLbl")}</div>
          <div style={{ height: 5, background: "var(--border2)", borderRadius: 3, marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${sc}%`, background: scC, borderRadius: 3 }} />
          </div>
          <div style={{ color: scC, fontSize: 15, fontFamily: "monospace", fontWeight: 600 }}>{sc}/100</div>
        </div>
        <MetricBox label={t("rebalLbl")} value={data.rebalanceNeeded ? t("rebalY") : t("rebalN")} accent={data.rebalanceNeeded ? "#ff8c42" : "#00d084"} />
        {data.cashRecommendation && <MetricBox label={t("cashLbl")} value={data.cashRecommendation} accent="#c9a84c" />}
      </div>
      <p style={{ color: "#aaa8b8", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{data.summary}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {data.warnings?.length > 0 && (
          <div>
            <div style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("warnLbl")}</div>
            {data.warnings.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                <span style={{ color: "#ff4d4d", fontSize: 10, marginTop: 2 }}>▸</span>
                <span style={{ color: "#886678", fontSize: 12 }}>{w}</span>
              </div>
            ))}
          </div>
        )}
        {data.strengths?.length > 0 && (
          <div>
            <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("strLbl")}</div>
            {data.strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                <span style={{ color: "#00d084", fontSize: 10, marginTop: 2 }}>▸</span>
                <span style={{ color: "#668866", fontSize: 12 }}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {data.sectorBreakdown?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("secLbl")}</div>
          {data.sectorBreakdown.map((s, i) => {
            const c = s.status === "overweight" ? "#ff4d4d" : s.status === "underweight" ? "#f5a623" : "#00d084";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 12, color: "#777788" }}>{s.sector}</div>
                <div style={{ width: 80, height: 4, background: "var(--border2)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${clamp(s.pct)}%`, background: c, borderRadius: 2 }} />
                </div>
                <div style={{ width: 35, textAlign: "right", fontSize: 11, fontFamily: "monospace", color: c }}>{s.pct}%</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        {data.hotAssets?.length > 0 && (
          <div>
            <div style={{ color: "#ff8c42", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("hotA")}</div>
            <div style={{ display: "flex", gap: 5 }}>{data.hotAssets.map((x, i) => <Tag key={i} color="#ff8c42">{x}</Tag>)}</div>
          </div>
        )}
        {data.undervaluedAssets?.length > 0 && (
          <div>
            <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("unA")}</div>
            <div style={{ display: "flex", gap: 5 }}>{data.undervaluedAssets.map((x, i) => <Tag key={i} color="#00d084">{x}</Tag>)}</div>
          </div>
        )}
        {data.sellCandidates?.length > 0 && (
          <div>
            <div style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{t("sellA")}</div>
            <div style={{ display: "flex", gap: 5 }}>{data.sellCandidates.map((x, i) => <Tag key={i} color="#ff4d4d">{x}</Tag>)}</div>
          </div>
        )}
      </div>
      {data.recommendations?.length > 0 && (
        <div>
          <div style={{ color: "#8b9cf7", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("prLbl")}</div>
          {data.recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <span style={{ color: "#8b9cf755", fontFamily: "monospace", fontSize: 10, minWidth: 18, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ color: "#77778a", fontSize: 12, lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}
