import { Lang } from "@/types";
import { useTrackRecord } from "@/hooks/useTrackRecord";
import { usePredictionsStats } from "@/hooks/usePredictionsStats";

interface Props {
  lang: Lang;
  userId?: string;
}

const SOURCES = [
  { emoji: "📊", label_ru: "Цена · P/E · бета · выручка · 52w диапазон", label_en: "Price · P/E · beta · revenue · 52w range", from_ru: "Yahoo Finance (реальные данные)", from_en: "Yahoo Finance (live data)" },
  { emoji: "📐", label_ru: "RSI(14) · SMA(50/200) · Pivot Points S1/R1", label_en: "RSI(14) · SMA(50/200) · Pivot Points S1/R1", from_ru: "Расчёт из дневных OHLC Yahoo Finance (детерминированный алгоритм)", from_en: "Calculated from Yahoo Finance daily OHLC (deterministic algorithm)" },
  { emoji: "🏦", label_ru: "Цена MOEX · OHLC · рыночная капитализация", label_en: "MOEX price · OHLC · market cap", from_ru: "MOEX ISS API (официальный API Московской биржи, бесплатный)", from_en: "MOEX ISS API (official Moscow Exchange API, free)" },
  { emoji: "📈", label_ru: "Доходность за 3 / 5 / 10 лет", label_en: "3 / 5 / 10-year price returns", from_ru: "Yahoo Finance chart (исторические котировки)", from_en: "Yahoo Finance chart (historical prices)" },
  { emoji: "😨", label_ru: "Индекс Fear & Greed (только для крипто)", label_en: "Fear & Greed Index (crypto only)", from_ru: "Alternative.me (реальный индекс)", from_en: "Alternative.me (live index)" },
  { emoji: "📰", label_ru: "Последние новости", label_en: "Recent news headlines", from_ru: "Yahoo Finance поиск (реальные заголовки)", from_en: "Yahoo Finance search (real headlines)" },
  { emoji: "🤖", label_ru: "Сентимент · волны Кондратьева · макро", label_en: "Sentiment · Kondratiev waves · macro", from_ru: "AI-оценка Claude Haiku 4.5 (не биржевые данные)", from_en: "AI estimate via Claude Haiku 4.5 (not exchange data)" },
];

const METHODOLOGY_RU = [
  ["Модель", "Claude Haiku 4.5 (Anthropic) — языковая модель, а не торговый алгоритм. Аналитическое заключение, не инвестиционная рекомендация по ФЗ-39."],
  ["Реальные данные", "Цена, мультипликаторы, исторические доходности — из Yahoo Finance / MOEX ISS. Вводятся в контекст перед генерацией ответа."],
  ["Расчётные TA", "RSI(14), SMA(50/200), Pivot Points S1/R1 — вычислены детерминированным алгоритмом из дневных OHLC. Верифицируемы в TradingView."],
  ["AI-оценка", "Сентимент, волны Кондратьева, макро-фон — оценки модели на основе паттернов обучающих данных, не из биржевого фида."],
  ["Кеш", "Результат кешируется на 24 часа. Кнопка «Обновить» сбрасывает кеш и делает новый запрос."],
  ["MOEX", "Для акций ММВБ используется MOEX ISS API (официальный, бесплатный). RSI/SMA/Pivot рассчитываются из дневных свечей MOEX."],
  ["Точность", "Каждый buy/sell сигнал логируется автоматически. Через 30 дней проверяется: если цена выросла на 10%+ (для buy) — сигнал верный. Результаты на этой странице."],
];

const METHODOLOGY_EN = [
  ["Model", "Claude Haiku 4.5 (Anthropic) — a language model, not a trading algorithm. Analytical conclusion, not individual investment advice under ФЗ-39."],
  ["Real data", "Price, valuation multiples, historical returns — from Yahoo Finance / MOEX ISS. Injected into model context before generation."],
  ["Calculated TA", "RSI(14), SMA(50/200), Pivot Points S1/R1 — computed by deterministic algorithm from daily OHLC. Verifiable in TradingView."],
  ["AI estimate", "Sentiment, Kondratiev waves, macro — model estimates from training data patterns, not a live exchange feed."],
  ["Cache", "Results are cached for 24 hours. The \"Refresh\" button evicts the cache and triggers a new fetch."],
  ["MOEX", "Moscow Exchange stocks use MOEX ISS API (official, free). RSI/SMA/Pivot calculated from MOEX daily candles."],
  ["Accuracy", "Every buy/sell signal is logged automatically. After 30 days: if price rose 10%+ (for buy) — signal is correct. Results shown on this page."],
];

const ACTION_COLOR: Record<string, string> = {
  buy:  "#00d084",
  sell: "#ff4d4d",
  hold: "#c9a84c",
  watch: "#8b9cf7",
};

const OUTCOME_COLOR: Record<string, string> = {
  correct:   "#00d084",
  incorrect: "#ff4d4d",
  partial:   "#c9a84c",
  pending:   "#555568",
};

function formatRelativeTime(isoDate: string | null, ru: boolean): string {
  if (!isoDate) return "—";
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return ru ? "только что" : "just now";
  if (hours < 24) return ru ? `${hours} ч. назад` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return ru ? `${days} д. назад` : `${days}d ago`;
}

export function AccuracyPage({ lang, userId }: Props) {
  const ru = lang !== "en";
  const methodology = ru ? METHODOLOGY_RU : METHODOLOGY_EN;
  const tr = useTrackRecord(userId);
  const ps = usePredictionsStats();

  const hasPublicData = ps.total > 0;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "var(--accent)", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace", marginBottom: 6 }}>
          {ru ? "ПРОЗРАЧНОСТЬ" : "TRANSPARENCY"}
        </div>
        <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
          {ru ? "Историческая совпадаемость технических паттернов" : "Historical Pattern Coincidence Rate & Methodology"}
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
          {ru
            ? "Мы публикуем эту страницу с первого дня — даже с нулевыми данными. Наша цель: дать вам полную картину того, что модель делает честно, а что оценивает приблизительно."
            : "We publish this page from day one — even with zero data. Our goal: give you a complete picture of what the model does reliably, and what it estimates approximately."}
        </p>
      </div>

      {/* Public predictions stats */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            {ru ? "Публичный track record" : "Public Track Record"}
          </span>
          {ps.lastVerifiedAt && (
            <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
              {ru ? "Последняя проверка:" : "Last verified:"} {formatRelativeTime(ps.lastVerifiedAt, ru)}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: hasPublicData ? 20 : 0 }}>
          {[
            { label: ru ? "Всего сигналов" : "Total signals", value: ps.total > 0 ? String(ps.total) : "—" },
            { label: ru ? "Верифицировано" : "Verified", value: ps.verified > 0 ? String(ps.verified) : "—" },
            { label: ru ? "Точность" : "Accuracy", value: ps.accuracyPct != null ? `${ps.accuracyPct}%` : "—", highlight: ps.accuracyPct != null },
            { label: ru ? "Ср. рост (buy)" : "Avg gain (buy)", value: ps.avgGainOnCorrect != null ? `+${ps.avgGainOnCorrect}%` : "—", highlight: ps.avgGainOnCorrect != null },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: highlight ? "#00d084" : "var(--accent)", fontFamily: "monospace" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Recent predictions table */}
        {hasPublicData && ps.recentPredictions.length > 0 ? (
          <div>
            <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 10 }}>
              {ru ? "ПОСЛЕДНИЕ СИГНАЛЫ" : "RECENT SIGNALS"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ps.recentPredictions.map((p, i) => {
                const priceDiff = p.priceAtVerify && p.priceAt
                  ? ((p.priceAtVerify - p.priceAt) / p.priceAt * 100).toFixed(1)
                  : null;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 48px 70px 1fr 80px 70px", gap: 8, alignItems: "center", padding: "7px 10px", background: "var(--bg3)", borderRadius: 7, fontSize: 11, fontFamily: "monospace" }}>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{p.ticker}</span>
                    <span style={{ color: ACTION_COLOR[p.action] || "var(--text2)", fontWeight: 600 }}>{p.action.toUpperCase()}</span>
                    <span style={{ color: "var(--text3)" }}>{p.currency} {Number(p.priceAt).toFixed(2)}</span>
                    <span style={{ color: "var(--text3)", fontSize: 10 }}>{formatRelativeTime(p.createdAt, ru)}</span>
                    <span style={{ color: priceDiff != null ? (parseFloat(priceDiff) >= 0 ? "#00d084" : "#ff4d4d") : "var(--text3)" }}>
                      {priceDiff != null ? `${parseFloat(priceDiff) >= 0 ? "+" : ""}${priceDiff}%` : "⏳"}
                    </span>
                    <span style={{ color: OUTCOME_COLOR[p.outcome || "pending"] || "var(--text3)", fontWeight: 600, fontSize: 10 }}>
                      {p.outcome === "correct" ? (ru ? "✓ верно" : "✓ correct")
                        : p.outcome === "incorrect" ? (ru ? "✗ неверно" : "✗ wrong")
                        : p.outcome === "partial" ? (ru ? "~ частично" : "~ partial")
                        : (ru ? "⏳ ожидает" : "⏳ pending")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "12px 16px" }}>
            <span style={{ color: "#c9a84c", fontSize: 11, fontFamily: "monospace" }}>
              ⏳ {ru
                ? "Сигналы накапливаются. Верификация начнётся через 30 дней после первых анализов — каждый buy/sell сигнал проверяется реальной ценой."
                : "Signals are accumulating. Verification begins 30 days after the first analyses — each buy/sell signal is checked against actual prices."}
            </span>
          </div>
        )}
      </div>

      {/* Personal track record */}
      {userId && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
              {ru ? "Ваши верифицированные прогнозы" : "Your Verified Predictions"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { label: ru ? "Верифицировано" : "Verified", value: tr.total > 0 ? String(tr.total) : "—" },
              { label: ru ? "Верных" : "Correct", value: tr.correct > 0 ? String(tr.correct) : "—" },
              { label: ru ? "Точность" : "Accuracy", value: tr.accuracyPct != null ? `${tr.accuracyPct}%` : "—" },
              { label: ru ? "Частичных" : "Partial", value: tr.partial > 0 ? String(tr.partial) : "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)", fontFamily: "monospace" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data sources */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🗂</span>
          <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            {ru ? "Источники данных" : "Data Sources"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SOURCES.map((s) => (
            <div key={s.emoji} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border2)" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{ru ? s.label_ru : s.label_en}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace", marginTop: 2 }}>{ru ? s.from_ru : s.from_en}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>⚙</span>
          <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            {ru ? "Как это работает" : "How It Works"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {methodology.map(([key, val], i) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, padding: "12px 0", borderBottom: i < methodology.length - 1 ? "1px solid var(--border2)" : "none" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent)", fontWeight: 600, paddingTop: 1 }}>{key}</span>
              <span style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "14px 18px", background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 8, borderLeft: "2px solid rgba(255,165,0,0.5)" }}>
        <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace", lineHeight: 1.7 }}>
          ⚠ {ru
            ? "Данный сервис предоставляет информационные аналитические заключения на основе исторических паттернов и НЕ является индивидуальной инвестиционной рекомендацией в смысле ст. 6.1 Федерального закона от 22.04.1996 № 39-ФЗ «О рынке ценных бумаг». Прошлая совпадаемость паттернов не гарантирует аналогичных результатов в будущем. Все инвестиционные решения принимаются пользователем самостоятельно и на собственный риск."
            : "This service provides informational analytical conclusions based on historical patterns and does NOT constitute individual investment advice. Past pattern coincidence rates do not guarantee future results. All investment decisions are made independently and at the user's own risk."}
        </span>
      </div>
    </div>
  );
}
