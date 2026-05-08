import { CSSProperties } from "react";
import { AnalysisData, Lang } from "@/types";
import { STATC } from "@/constants/colors";
import { n, fmt, fmtMaybe } from "@/utils/format";
import { TR } from "@/constants/translations";
import { SectionBlock, MetricBox } from "@/components/atoms";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

interface Props {
  data: AnalysisData;
  lang: Lang;
  sectionNum: number;
  collapsed?: boolean;
  onToggle?: () => void;
  style?: CSSProperties;
}

export function Valuation({ data, lang, sectionNum, collapsed, onToggle, style }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const sC = STATC[n(data.valuation?.status) as keyof typeof STATC] ?? STATC.fair;
  const cur = data.valuation?.currency || "USD";
  const curP = data.valuation?.currentPrice;
  const { selected: selCur, convert, symbol: selSymbol } = useCurrencyContext();
  const showConverted = selCur !== cur && curP != null;
  const isCrypto = data.asset?.assetClass === "crypto";
  const naLabel = lang === "ru" ? "Н/П" : "N/A";
  const naSub = lang === "ru" ? "не применимо для крипто" : "not applicable for crypto";
  const cryptoMetric = (val: unknown) => {
    const s = fmtMaybe(val);
    return isCrypto && s == null
      ? { value: naLabel, sub: naSub, accent: "#444456" as string | undefined }
      : { value: s, sub: undefined as string | undefined, accent: undefined as string | undefined };
  };

  const convertedPrice = showConverted && curP != null ? convert(curP, cur) : null;
  const convertedFair = showConverted && data.valuation?.fairPrice != null ? convert(data.valuation.fairPrice, cur) : null;

  return (
    <SectionBlock sectionNum={sectionNum} title={t("s02")} collapsed={collapsed} onToggle={onToggle} style={style}>
      {curP != null && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 3 }}>{t("nowLbl")}</div>
              <div style={{ fontSize: 26, fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{cur === "USD" ? "$" : cur}{fmt(curP)}</div>
              {convertedPrice != null && (
                <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{t("curApprox")} {selSymbol}{fmt(convertedPrice)}</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 3 }}>{t("fairLbl")}</div>
              <div style={{ fontSize: 26, fontFamily: "monospace", fontWeight: 600, color: sC.c }}>{cur === "USD" ? "$" : cur}{fmt(data.valuation.fairPrice)}</div>
              {convertedFair != null && (
                <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{t("curApprox")} {selSymbol}{fmt(convertedFair)}</div>
              )}
            </div>
          </div>
          <div style={{ background: `${sC.c}10`, border: `1px solid ${sC.c}25`, borderRadius: 7, padding: "8px 14px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: sC.c, fontSize: 13, fontWeight: 600 }}>
              {sC.s === "↓" ? t("undervalued") : sC.s === "+" ? t("overvalued") : t("fairVal")}
            </span>
            <span style={{ color: sC.c, fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>
              {sC.s !== "≈" ? `${sC.s}${Math.abs(data.valuation.priceDiff || 0).toFixed(1)}%` : "≈"}
            </span>
          </div>
          {data.valuation.marginOfSafety != null && (
            <div style={{ background: "rgba(201,168,76,0.07)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 14px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#c9a84c", fontSize: 12 }}>{t("safety")}</span>
              <span style={{ color: "#c9a84c", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>
                {data.valuation.marginOfSafety > 0 ? "+" : ""}{data.valuation.marginOfSafety}%
              </span>
            </div>
          )}
          {data.valuation.growthPotential != null && (
            <div style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 7, padding: "7px 14px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#00d084", fontSize: 12 }}>{t("growthPot")}</span>
              <span style={{ color: "#00d084", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>
                {data.valuation.growthPotential > 0 ? "+" : ""}{data.valuation.growthPotential.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {(() => {
          const pe = cryptoMetric(data.valuation?.metrics?.pe);
          const ps = cryptoMetric(data.valuation?.metrics?.ps);
          const ev = cryptoMetric(data.valuation?.metrics?.evEbitda);
          const de = cryptoMetric(data.valuation?.metrics?.debtToEquity);
          const rg = cryptoMetric(data.valuation?.metrics?.revenueGrowth);
          const mg = cryptoMetric(data.valuation?.metrics?.margin);
          const pg = cryptoMetric(data.valuation?.metrics?.profitGrowth);
          return (<>
            <MetricBox label={t("pe")} value={pe.value} sub={pe.sub} accent={pe.accent} />
            <MetricBox label={t("ps")} value={ps.value} sub={ps.sub} accent={ps.accent} />
            <MetricBox label={t("ev")} value={ev.value} sub={ev.sub} accent={ev.accent} />
            <MetricBox label={t("de")} value={de.value} sub={de.sub} accent={de.accent} />
            <MetricBox label={t("rg")} value={rg.value} sub={rg.sub} accent={rg.accent} />
            <MetricBox label={t("mc")} value={fmtMaybe(data.valuation?.metrics?.marketCap)} />
            <MetricBox label={t("mg")} value={mg.value} sub={mg.sub} accent={mg.accent} />
            <MetricBox label={t("pg")} value={pg.value} sub={pg.sub} accent={pg.accent} />
          </>);
        })()}
      </div>
    </SectionBlock>
  );
}
