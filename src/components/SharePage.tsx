import { useState, useEffect } from "react";
import { AnalysisData, Lang } from "@/types";
import { ACTC, RISKC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { Tag } from "@/components/atoms";
import { supabase } from "@/lib/supabase";

interface Props {
  shareId: string;
  lang: Lang;
  onSignUp: () => void;
}

export function SharePage({ shareId, lang, onSignUp }: Props) {
  const ru = lang !== "en";
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!supabase) { setNotFound(true); setLoading(false); return; }
    if (!/^[a-z0-9]{6,16}$/.test(shareId)) { setNotFound(true); setLoading(false); return; }
    Promise.resolve(
      supabase.from("shared_analyses")
        .select("data, lang")
        .eq("id", shareId)
        .gt("expires_at", new Date().toISOString())
        .single()
    ).then(({ data: row, error }) => {
      if (error || !row) { setNotFound(true); }
      else { setData(row.data as AnalysisData); }
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  // Update OG / page title when data loads
  useEffect(() => {
    if (!data) return;
    const ticker = data.asset?.ticker ?? "";
    const action = data.recommendation?.action ?? "watch";
    const actionLabel = { buy: ru ? "КУПИТЬ" : "BUY", sell: ru ? "ПРОДАВАТЬ" : "SELL", hold: ru ? "ДЕРЖАТЬ" : "HOLD", watch: ru ? "НАБЛЮДАТЬ" : "WATCH" }[action] ?? action.toUpperCase();
    document.title = `${ticker} — AI-сигнал: ${actionLabel} | Инвестиционный Аналитик`;
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content",
      ru
        ? `AI-анализ ${ticker}: ${actionLabel}. Цена $${fmt(data.valuation?.currentPrice ?? 0)}, потенциал ${(data.valuation?.growthPotential ?? 0) > 0 ? "+" : ""}${data.valuation?.growthPotential?.toFixed(1)}%.`
        : `AI analysis of ${ticker}: ${actionLabel}. Price $${fmt(data.valuation?.currentPrice ?? 0)}, potential ${(data.valuation?.growthPotential ?? 0) > 0 ? "+" : ""}${data.valuation?.growthPotential?.toFixed(1)}%.`
    );
  }, [data, ru]);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "Georgia, serif",
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c9a84c", fontFamily: "monospace", fontSize: 13 }}>
        {ru ? "Загрузка анализа..." : "Loading analysis..."}
      </div>
    </div>
  );

  if (notFound || !data) return (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>📭</div>
      <div style={{ color: "var(--text)", fontSize: 18, fontWeight: 700 }}>
        {ru ? "Анализ не найден" : "Analysis not found"}
      </div>
      <div style={{ color: "#666678", fontSize: 13 }}>
        {ru ? "Ссылка устарела или недействительна." : "This link has expired or is invalid."}
      </div>
      <button onClick={onSignUp} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#07070d", fontSize: 14, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
        {ru ? "Создать свой анализ →" : "Create your own analysis →"}
      </button>
    </div>
  );

  const aC = ACTC[n(data.recommendation?.action) as keyof typeof ACTC] ?? ACTC.watch;
  const rC = RISKC[n(data.riskProfile?.score) as keyof typeof RISKC] ?? RISKC.medium;
  const actionLabel = { buy: ru ? "КУПИТЬ" : "BUY", sell: ru ? "ПРОДАВАТЬ" : "SELL", hold: ru ? "ДЕРЖАТЬ" : "HOLD", watch: ru ? "НАБЛЮДАТЬ" : "WATCH" }[n(data.recommendation?.action)] ?? "WATCH";
  const cur = data.valuation?.currency ?? "$";

  return (
    <div style={containerStyle}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid var(--border2)", backdropFilter: "blur(12px)", background: "rgba(7,7,13,0.8)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#c9a84c", fontSize: 18 }}>◎</span>
            <span style={{ color: "#c9a84c", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.1em" }}>
              INVESTMENT ANALYST
            </span>
          </div>
          <button onClick={onSignUp} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 7, padding: "7px 16px", color: "#07070d", fontSize: 12, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
            {ru ? "Попробовать бесплатно →" : "Try free →"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px", position: "relative" }}>

        {/* Shared badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <span style={{ background: "rgba(139,156,247,0.1)", border: "1px solid rgba(139,156,247,0.25)", borderRadius: 20, padding: "3px 12px", color: "#8b9cf7", fontSize: 10, fontFamily: "monospace" }}>
            {ru ? "⤴ ПОДЕЛИЛИСЬ АНАЛИЗОМ" : "⤴ SHARED ANALYSIS"}
          </span>
        </div>

        {/* Signal banner */}
        <div style={{ background: aC.bg, border: `1px solid ${aC.br}33`, borderLeft: `3px solid ${aC.br}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 10, letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: 4 }}>
                {ru ? "AI-СИГНАЛ" : "AI SIGNAL"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", fontFamily: "monospace" }}>
                {data.asset?.ticker}
              </div>
              <div style={{ color: "#666678", fontSize: 13, marginTop: 2 }}>{data.asset?.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Tag color={aC.c}>{actionLabel}</Tag>
              {data.valuation?.currentPrice != null && (
                <div style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, fontFamily: "monospace", marginTop: 8 }}>
                  {cur}{fmt(data.valuation.currentPrice)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: ru ? "Справедливая цена" : "Fair value", value: data.valuation?.fairPrice != null ? `${cur}${fmt(data.valuation.fairPrice)}` : "—", color: undefined },
            { label: ru ? "Потенциал" : "Potential", value: data.valuation?.growthPotential != null ? `${data.valuation.growthPotential > 0 ? "+" : ""}${data.valuation.growthPotential.toFixed(1)}%` : "—", color: data.valuation?.growthPotential != null && data.valuation.growthPotential > 0 ? "#00d084" : "#ff4d4d" },
            { label: ru ? "Риск" : "Risk", value: { low: ru ? "Низкий" : "Low", medium: ru ? "Средний" : "Medium", high: ru ? "Высокий" : "High" }[n(data.riskProfile?.score)] ?? "—", color: rC.c },
            { label: ru ? "Кондратьев" : "Kondratiev", value: { spring: ru ? "Весна" : "Spring", summer: ru ? "Лето" : "Summer", autumn: ru ? "Осень" : "Autumn", winter: ru ? "Зима" : "Winter" }[n(data.kondratiev?.currentPhase)] ?? "—", color: undefined },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>{label}</div>
              <div style={{ color: color ?? "var(--text)", fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {data.recommendation?.summary && (
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, borderLeft: "2px solid rgba(201,168,76,0.3)" }}>
            <div style={{ color: "#444456", fontSize: 9, fontFamily: "monospace", marginBottom: 6 }}>
              {ru ? "РЕЗЮМЕ АНАЛИЗА" : "ANALYSIS SUMMARY"}
            </div>
            <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>
              {data.recommendation.summary}
            </p>
          </div>
        )}

        {/* Key points (blurred after 2) */}
        {data.recommendation?.keyPoints && data.recommendation.keyPoints.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: "#444456", fontSize: 9, fontFamily: "monospace", marginBottom: 10 }}>
              {ru ? "КЛЮЧЕВЫЕ ТЕЗИСЫ" : "KEY POINTS"}
            </div>
            {data.recommendation.keyPoints.slice(0, 2).map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8 }}>
                <span style={{ color: "#c9a84c55", fontFamily: "monospace", fontSize: 10, minWidth: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.5 }}>{pt}</span>
              </div>
            ))}
            {data.recommendation.keyPoints.length > 2 && (
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 8 }}>
                <div style={{ padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", filter: "blur(3px)", userSelect: "none" }}>
                  <div style={{ color: "var(--text2)", fontSize: 12 }}>{data.recommendation.keyPoints[2]}</div>
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,7,13,0.5)" }}>
                  <span style={{ color: "#c9a84c", fontSize: 11, fontFamily: "monospace" }}>
                    +{data.recommendation.keyPoints.length - 2} {ru ? "тезисов" : "more"} 🔒
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ padding: "10px 14px", background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 8, borderLeft: "2px solid rgba(255,165,0,0.5)", marginBottom: 32 }}>
          <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>
            ⚠ {ru
              ? "Информационный сервис. Материалы созданы ИИ и НЕ являются индивидуальной инвестиционной рекомендацией в смысле ст. 6.1 Федерального закона от 22.04.1996 № 39-ФЗ «О рынке ценных бумаг». Все инвестиционные решения принимаются пользователем самостоятельно и на собственный риск."
              : "Informational service. AI-generated content does NOT constitute individual investment advice. All investment decisions are made independently and at your own risk."}
          </span>
        </div>

        {/* CTA */}
        <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
          <div style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {ru ? "Проанализируй свой актив" : "Analyze your own asset"}
          </div>
          <div style={{ color: "#666678", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            {ru
              ? "Макро, волны Кондратьева, 10 лет истории, техника — всё в одном отчёте. 7 попыток бесплатно."
              : "Macro, Kondratiev waves, 10-year history, technicals — all in one report. 7 tries free."}
          </div>
          <button onClick={onSignUp} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 10, padding: "14px 36px", color: "#07070d", fontSize: 15, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
            {ru ? "Попробовать бесплатно →" : "Try for free →"}
          </button>
          <div style={{ marginTop: 8, color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
            {ru ? "7 бесплатных анализов · Без кредитной карты" : "7 free analyses · No credit card"}
          </div>
        </div>
      </div>
    </div>
  );
}
