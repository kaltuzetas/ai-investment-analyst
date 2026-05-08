import { AnalysisData, Lang } from "@/types";
import { HEAT } from "@/constants/colors";
import { n, clamp } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock } from "@/components/atoms";

interface Props { data: AnalysisData; lang: Lang; sectionNum: number; collapsed?: boolean; onToggle?: () => void; }

export function MarketHeat({ data, lang, sectionNum, collapsed, onToggle }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const hC = HEAT[n(data.valuation?.marketHeatIndex) as keyof typeof HEAT] ?? HEAT.normal;
  const hLbl = { cold: t("hC"), normal: t("hNo"), warm: t("hWa"), hot: t("hHo"), overheated: t("hOv") }[n(data.valuation?.marketHeatIndex)] ?? "—";

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s10")} collapsed={collapsed} onToggle={onToggle} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            {(["cold", "normal", "warm", "hot", "overheated"] as const).map((k) => (
              <span key={k} style={{ fontSize: 9, fontFamily: "monospace", color: HEAT[k].c, opacity: n(data.valuation?.marketHeatIndex) === k ? 1 : 0.3 }}>
                {t({ cold: "hC", normal: "hNo", warm: "hWa", hot: "hHo", overheated: "hOv" }[k])}
              </span>
            ))}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--border2)" }}>
            <div style={{ height: "100%", width: `${clamp(hC.b)}%`, background: `linear-gradient(90deg,#00d084,${hC.c})`, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ background: `${hC.c}15`, border: `1px solid ${hC.c}40`, borderRadius: 8, padding: "8px 16px" }}>
          <div style={{ color: hC.c, fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{hLbl}</div>
        </div>
      </div>
      {data.valuation?.marketHeatReason && (
        <p style={{ color: "#555568", fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>{data.valuation.marketHeatReason}</p>
      )}
    </SectionBlock>
  );
}
