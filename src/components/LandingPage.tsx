import { useState, useEffect } from "react";
import { Lang } from "@/types";
import { AnalysisData } from "@/types";
import { getDemoData } from "@/constants/demoData";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { AuthState } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { LegalModal } from "@/components/modals/LegalModal";
import { stashPendingShare } from "@/hooks/useShareAnalysis";
import { stashPendingRef } from "@/hooks/useReferral";
import { supabase } from "@/lib/supabase";
import { callAPI } from "@/utils/apiCall";
import { makeSysPrompt } from "@/prompts/systemPrompt";
import { AssetInfo } from "@/components/analysis/sections/AssetInfo";
import { Valuation } from "@/components/analysis/sections/Valuation";

const CACHE_KEY = (lang: string) => `ais_btc_landing_${lang}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function loadCached(lang: string): { data: AnalysisData; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(lang));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveCache(data: AnalysisData, lang: string) {
  try { localStorage.setItem(CACHE_KEY(lang), JSON.stringify({ data, ts: Date.now() })); } catch {}
}

interface Props {
  lang: Lang;
  auth: AuthState;
  onLangChange: (l: Lang) => void;
}

const THEME_LABELS: Record<Theme, string> = { dark: "◑", light: "☀", warm: "🕯" };

export function LandingPage({ lang, auth, onLangChange }: Props) {
  const ru = lang !== "en";
  const { theme, setTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"tos" | "privacy" | null>(null);

  // Stash ?share= and ?ref= params so App.tsx can handle them after auth
  useEffect(() => { stashPendingShare(); stashPendingRef(); }, []);

  // Fetch social proof counter
  useEffect(() => {
    if (!supabase) return;
    Promise.resolve(
      supabase.from("analytics_counters").select("value").eq("key", "total_analyses").single()
    ).then(({ data }) => { if (data) setTotalAnalyses(data.value as number); })
      .catch(() => {});
  }, []);
  const [btc, setBtc] = useState<AnalysisData | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<{ total: number; verified: number; correct: number; accuracy: number | null } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    Promise.resolve(supabase.rpc("get_accuracy_stats"))
      .then(({ data }) => { if (data) setAccuracy(data as typeof accuracy); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cached = loadCached(lang);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setBtc(cached.data);
      const hours = Math.floor((Date.now() - cached.ts) / 3600000);
      setCacheAge(hours === 0 ? (ru ? "только что" : "just now") : `${hours}${ru ? " ч назад" : "h ago"}`);
    } else {
      // Use language-specific demo data immediately, try to refresh in background
      setBtc(getDemoData(lang)["BTC"] ?? null);
      setCacheAge(null);
      // Attempt live refresh (only if API available, ignore errors)
      const ctrl = new AbortController();
      const msg = ru
        ? "Проанализируй Bitcoin (BTC) ТОЛЬКО НА РУССКОМ языке. Найди текущие данные, макро, историю 3/5/10 лет, позицию в волнах Кондратьева, технический анализ и сентимент."
        : "Analyze Bitcoin (BTC) IN ENGLISH ONLY. Find current data, macro, 3/5/10 year history, Kondratiev wave position, technical analysis, sentiment.";
      callAPI([{ role: "user", content: msg }], makeSysPrompt(lang, undefined), ctrl.signal)
        .then(data => {
          const analysis = data as AnalysisData;
          if (analysis?.asset) { setBtc(analysis); saveCache(analysis, lang); setCacheAge(null); }
        })
        .catch(() => { /* keep demo data */ });
      return () => ctrl.abort();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const rec = btc?.recommendation;
  const price = btc?.valuation?.currentPrice;
  const trend = btc?.trendAnalysis;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Georgia, serif", transition: "background 0.3s, color 0.3s" }}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--border2)", backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, color: "var(--accent)", opacity: 0.7 }}>◎</span>
            <div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "monospace", letterSpacing: "0.2em" }}>INVESTMENT INTELLIGENCE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>
                {ru ? "Инвестиционный Аналитик" : "Investment Analyst"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Lang */}
            <div style={{ display: "flex", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 7, padding: 2, gap: 2 }}>
              {(["ru", "en"] as Lang[]).map(l => (
                <button key={l} onClick={() => onLangChange(l)} style={{ background: lang === l ? "var(--border)" : "transparent", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer", color: lang === l ? "var(--accent)" : "var(--text3)", fontSize: 11, fontFamily: "monospace", fontWeight: lang === l ? 700 : 400, textTransform: "uppercase" }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Theme */}
            <div style={{ display: "flex", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 7, padding: 2, gap: 2 }}>
              {(["dark", "light", "warm"] as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)} title={t} style={{ background: theme === t ? "var(--border)" : "transparent", border: "none", borderRadius: 5, padding: "4px 9px", cursor: "pointer", fontSize: 13 }}>
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Sign in */}
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 8, padding: "8px 18px", color: "#07070d", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}
            >
              {ru ? "Войти" : "Sign in"}
            </button>
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--text2)", fontSize: 13, fontFamily: "monospace", cursor: "pointer" }}
            >
              {ru ? "Регистрация" : "Register"}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 20px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.3em", marginBottom: 12 }}>
            {ru ? "ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ · ФИНАНСОВЫЙ АНАЛИЗ" : "ARTIFICIAL INTELLIGENCE · FINANCIAL ANALYSIS"}
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.1, background: `linear-gradient(135deg,var(--text) 0%,var(--accent) 50%,var(--accent2) 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>
            {ru ? "Анализируй активы\nс помощью ИИ" : "Analyze assets\nwith AI"}
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
            {ru
              ? "Макро, волны Кондратьева, 10 лет истории, технический анализ — всё в одном отчёте. 7 попыток бесплатно."
              : "Macro, Kondratiev waves, 10-year history, technical analysis — all in one report. 7 free tries."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowAuth(true)} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 10, padding: "14px 32px", color: "#07070d", fontSize: 15, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
              {ru ? "Попробовать бесплатно →" : "Try for free →"}
            </button>
          </div>
          <div style={{ marginTop: 12, color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
            {ru ? "7 попыток бесплатно · Без кредитной карты" : "7 free tries · No credit card"}
          </div>
          {totalAnalyses !== null && totalAnalyses >= 50 && (
            <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 20, padding: "6px 16px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9a84c", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ color: "#c9a84c88", fontSize: 11, fontFamily: "monospace" }}>
                {ru
                  ? `${totalAnalyses.toLocaleString("ru-RU")}+ активов уже проанализировано`
                  : `${totalAnalyses.toLocaleString("en-US")}+ assets analyzed`}
              </span>
            </div>
          )}
        </div>

        {/* ── BTC ANALYSIS BLOCKS ── */}
        {btc && (
          <div style={{ marginBottom: 48 }}>

            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(247,147,26,0.15)", border: "1px solid rgba(247,147,26,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>₿</div>
                <div>
                  <div style={{ color: "var(--text)", fontSize: 16, fontWeight: 700 }}>Bitcoin (BTC)</div>
                  <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
                    {ru ? "Живой анализ · обновляется раз в 24ч" : "Live analysis · updated every 24h"}
                    {cacheAge && ` · ${cacheAge}`}
                  </div>
                </div>
              </div>
              {price && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>${price.toLocaleString()}</div>
                  {trend?.return3y && <div style={{ color: "#00d084", fontSize: 11, fontFamily: "monospace" }}>{trend.return3y} {ru ? "за 3 года" : "3y return"}</div>}
                </div>
              )}
            </div>

            {/* ── BLOCKS 1 & 2: реальные компоненты из анализа, рядом ── */}
            {(() => {
              const displayData = btc ?? getDemoData(lang)["BTC"]!;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, alignItems: "stretch" }}>

                  {/* Block 1 — AssetInfo */}
                  <AssetInfo data={displayData} lang={lang} sectionNum={1} style={{ height: "100%", boxSizing: "border-box" }} />

                  {/* Block 2 — Valuation с размытием нижней половины */}
                  <div style={{ position: "relative", overflow: "hidden", borderRadius: 10 }}>
                    <Valuation data={displayData} lang={lang} sectionNum={2} style={{ height: "100%", boxSizing: "border-box" }} />
                    {/* Blur overlay — нижние ~50% */}
                    <div style={{
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      height: "52%",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      background: "linear-gradient(to bottom, transparent 0%, var(--bg2) 70%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }} />
                  </div>

                </div>
              );
            })()}

            {/* ── BLOCK 4: Action Plan (locked/blurred) ── */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              {/* Blurred content */}
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", filter: "blur(4px)", userSelect: "none", pointerEvents: "none", opacity: 0.7 }}>
                <div style={{ color: "var(--text3)", fontSize: 10, letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: 14 }}>
                  04 — {ru ? "ПЛАН ДЕЙСТВИЙ" : "ACTION PLAN"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: ru ? "ЗОНА ПОКУПКИ" : "BUY ZONE", value: rec?.buyZoneLow && rec?.buyZoneHigh ? `$${rec.buyZoneLow.toLocaleString()}–${rec.buyZoneHigh.toLocaleString()}` : "—", color: "#00d084" },
                    { label: ru ? "ЦЕЛЬ ПРИБЫЛИ" : "PROFIT TARGET", value: rec?.sellTarget ? `$${rec.sellTarget.toLocaleString()}` : "—", color: "#c9a84c" },
                    { label: ru ? "СТОП-ЛОСС" : "STOP LOSS", value: rec?.stopLoss ? `$${rec.stopLoss.toLocaleString()}` : "—", color: "#ff4d4d" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ color, fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{label}</div>
                      <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
                    </div>
                  ))}
                </div>
                {rec?.keyPoints && rec.keyPoints.length > 0 && (
                  <div>
                    <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace", marginBottom: 8 }}>{ru ? "КЛЮЧЕВЫЕ ТЕЗИСЫ" : "KEY POINTS"}</div>
                    {rec.keyPoints.slice(0, 3).map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "8px 12px", background: "var(--bg3)", borderRadius: 6 }}>
                        <span style={{ color: "#c9a84c55", fontFamily: "monospace", fontSize: 10, minWidth: 18 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.5 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lock overlay */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, borderRadius: 12, background: "rgba(7,7,13,0.45)", backdropFilter: "blur(1px)" }}>
                <div style={{ fontSize: 28, opacity: 0.8 }}>🔒</div>
                <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", textAlign: "center" }}>
                  {ru ? "Зарегистрируйтесь чтобы увидеть план действий" : "Register to unlock the action plan"}
                </div>
                <button
                  onClick={() => setShowAuth(true)}
                  style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 9, padding: "12px 28px", color: "#07070d", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}
                >
                  {ru ? "Развернуть информацию →" : "Unlock full analysis →"}
                </button>
                <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
                  {ru ? "7 бесплатных анализов · Без кредитной карты" : "7 free analyses · No credit card"}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 8 }}>
              {ru ? "КАК ЭТО РАБОТАЕТ" : "HOW IT WORKS"}
            </div>
            <div style={{ color: "var(--text)", fontSize: 22, fontWeight: 700 }}>
              {ru ? "3 шага до полного AI-отчёта" : "3 steps to a full AI report"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, maxWidth: 860, margin: "0 auto" }}>
            {[
              {
                step: "01",
                icon: "⌨",
                title: ru ? "Введите тикер" : "Enter a ticker",
                text: ru ? "Напишите тикер акции, название компании или криптовалюту — AAPL, Tesla, BTC, SBER." : "Type a stock ticker, company name, or crypto — AAPL, Tesla, BTC, SBER.",
                color: "#c9a84c",
              },
              {
                step: "02",
                icon: "🧠",
                title: ru ? "ИИ анализирует" : "AI analyzes",
                text: ru ? "Claude анализирует макроэкономику, 10-летнюю историю, волны Кондратьева, технику и сентимент рынка." : "Claude analyzes macro, 10-year history, Kondratiev cycles, technicals, and market sentiment.",
                color: "#8b9cf7",
              },
              {
                step: "03",
                icon: "📋",
                title: ru ? "Получите отчёт" : "Get your report",
                text: ru ? "Полный AI-сигнал с зонами входа, стоп-лоссом, целевой ценой и оценкой рисков." : "Full AI signal with entry zones, stop-loss, price target, and risk assessment.",
                color: "#00d084",
              },
            ].map(({ step, icon, title, text, color }) => (
              <div key={step} style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 14, padding: "22px 20px", position: "relative" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ color, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 6 }}>ШАГ {step}</div>
                <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6 }}>{text}</div>
                <div style={{ position: "absolute", top: 16, right: 16, color, fontSize: 22, fontFamily: "monospace", fontWeight: 900, opacity: 0.15 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRACK RECORD ── */}
        {accuracy && (accuracy.verified > 0) && (
          <div style={{ marginBottom: 60 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 8 }}>
                {ru ? "ТРЕК-РЕКОРД AI" : "AI TRACK RECORD"}
              </div>
              <div style={{ color: "var(--text)", fontSize: 22, fontWeight: 700 }}>
                {ru ? "Историческая совпадаемость технических паттернов" : "Historical Pattern Coincidence Rate"}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, maxWidth: 680, margin: "0 auto 16px" }}>
              {[
                { label: ru ? "Анализов сделано" : "Analyses done", value: accuracy.total.toLocaleString(ru ? "ru-RU" : "en-US"), color: "#c9a84c" },
                { label: ru ? "Паттернов проверено" : "Patterns verified", value: accuracy.verified.toLocaleString(ru ? "ru-RU" : "en-US"), color: "#8b9cf7" },
                { label: ru ? "Совпадаемость" : "Coincidence rate", value: accuracy.accuracy != null ? `${accuracy.accuracy}%` : "—", color: accuracy.accuracy != null && accuracy.accuracy >= 60 ? "#00d084" : "#f5a623" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--bg2)", border: `1px solid ${color}22`, borderRadius: 12, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ color, fontSize: 28, fontWeight: 900, fontFamily: "monospace", marginBottom: 4 }}>{value}</div>
                  <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 10, fontFamily: "monospace", lineHeight: 1.6 }}>
              {ru
                ? "Совпадаемость рассчитана по верифицированным историческим паттернам через backtest-модуль. Прошлые паттерны не гарантируют аналогичных результатов в будущем. Не является индивидуальной инвестиционной рекомендацией (ст. 6.1 39-ФЗ)."
                : "Coincidence rate calculated from verified historical patterns via the backtest module. Past patterns do not guarantee future results. Not individual investment advice."}
            </div>
          </div>
        )}

        {/* ── Features ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 60 }}>
          {[
            { icon: "📊", title: ru ? "Полный анализ" : "Full analysis", text: ru ? "Макро, технический, Кондратьев, сентимент" : "Macro, technical, Kondratiev, sentiment" },
            { icon: "💼", title: ru ? "Портфель" : "Portfolio", text: ru ? "Отслеживание активов и P&L в реальном времени" : "Track assets and P&L in real time" },
            { icon: "🔍", title: ru ? "Скринер" : "Screener", text: ru ? "24 актива с AI-сигналами" : "24 assets with AI signals" },
            { icon: "🔔", title: ru ? "Алерты" : "Alerts", text: ru ? "Уведомления о входе в зону покупки" : "Alerts on buy zone entry" },
          ].map(({ icon, title, text }) => (
            <div key={title} style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* ── PRICING ── */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 8 }}>
              {ru ? "ТАРИФЫ" : "PRICING"}
            </div>
            <div style={{ color: "var(--text)", fontSize: 22, fontWeight: 700 }}>
              {ru ? "Простые цены, никаких скрытых платежей" : "Simple pricing, no hidden fees"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, maxWidth: 760, margin: "0 auto" }}>
            {/* Free */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 14, padding: "22px 20px" }}>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 6 }}>{ru ? "БЕСПЛАТНО" : "FREE"}</div>
              <div style={{ color: "var(--text)", fontSize: 28, fontWeight: 900, fontFamily: "monospace", marginBottom: 4 }}>₽0</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 16 }}>{ru ? "Без карты" : "No card needed"}</div>
              {[ru ? "7 анализов" : "7 analyses", ru ? "Портфель до 3 активов" : "Portfolio up to 3 assets", ru ? "История запросов" : "Query history"].map(f => (
                <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ color: "#00d08488", fontSize: 12 }}>✓</span>
                  <span style={{ color: "var(--text2)", fontSize: 12 }}>{f}</span>
                </div>
              ))}
              <button onClick={() => setShowAuth(true)} style={{ marginTop: 16, width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px", color: "var(--text2)", fontSize: 13, fontFamily: "monospace", cursor: "pointer" }}>
                {ru ? "Начать →" : "Start →"}
              </button>
            </div>
            {/* Старт */}
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 14, padding: "22px 20px" }}>
              <div style={{ color: "#c9a84c", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 6 }}>{ru ? "СТАРТ" : "STARTER"}</div>
              <div style={{ color: "var(--text)", fontSize: 28, fontWeight: 900, fontFamily: "monospace", marginBottom: 2 }}>₽299</div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 4 }}>{ru ? "/ месяц" : "/ month"}</div>
              <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 14 }}>
                {ru ? "или ₽2 490/год (-31%)" : "or ₽2,490/year (-31%)"}
              </div>
              {[ru ? "30 AI-анализов" : "30 AI analyses", ru ? "Полный портфель" : "Full portfolio", ru ? "Бэктест прогнозов" : "Forecast backtest", ru ? "Сравнение активов" : "Asset comparison"].map(f => (
                <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ color: "#c9a84c88", fontSize: 12 }}>✓</span>
                  <span style={{ color: "var(--text2)", fontSize: 12 }}>{f}</span>
                </div>
              ))}
              <button onClick={() => setShowAuth(true)} style={{ marginTop: 16, width: "100%", background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 8, padding: "10px", color: "#07070d", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
                {ru ? "Выбрать →" : "Get started →"}
              </button>
            </div>
            {/* Про */}
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(139,156,247,0.45)", borderRadius: 14, padding: "22px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(139,156,247,0.15)", border: "1px solid rgba(139,156,247,0.35)", borderRadius: 20, padding: "2px 10px", color: "#8b9cf7", fontSize: 9, fontFamily: "monospace" }}>
                {ru ? "ПОПУЛЯРНЫЙ" : "POPULAR"}
              </div>
              <div style={{ color: "#8b9cf7", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 6 }}>PRO</div>
              <div style={{ color: "var(--text)", fontSize: 28, fontWeight: 900, fontFamily: "monospace", marginBottom: 2 }}>₽699</div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 4 }}>{ru ? "/ месяц" : "/ month"}</div>
              <div style={{ color: "#00d084", fontSize: 10, fontFamily: "monospace", marginBottom: 14 }}>
                {ru ? "или ₽5 990/год (-29%)" : "or ₽5,990/year (-29%)"}
              </div>
              {[ru ? "100 AI-анализов" : "100 AI analyses", ru ? "Все функции Старт" : "All Starter features", ru ? "Portfolio Intelligence" : "Portfolio Intelligence", ru ? "Реферальная программа" : "Referral program", ru ? "Приоритетная поддержка" : "Priority support"].map(f => (
                <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ color: "#8b9cf788", fontSize: 12 }}>✓</span>
                  <span style={{ color: "var(--text2)", fontSize: 12 }}>{f}</span>
                </div>
              ))}
              <button onClick={() => setShowAuth(true)} style={{ marginTop: 16, width: "100%", background: "rgba(139,156,247,0.15)", border: "1px solid rgba(139,156,247,0.4)", borderRadius: 8, padding: "10px", color: "#8b9cf7", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
                {ru ? "Выбрать Pro →" : "Get Pro →"}
              </button>
            </div>
          </div>
        </div>

        {/* [I10-A] vs ChatGPT comparison */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ color: "var(--accent)", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace", marginBottom: 8 }}>
              {ru ? "ЗАЧЕМ НЕ CHATGPT?" : "WHY NOT CHATGPT?"}
            </div>
            <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 900, margin: 0 }}>
              {ru ? "ChatGPT — это чат. Это — инструмент." : "ChatGPT is a chat. This is a tool."}
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--text3)", borderBottom: "1px solid var(--border2)", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em" }}>{ru ? "ФУНКЦИЯ" : "FEATURE"}</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "#888", borderBottom: "1px solid var(--border2)", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em" }}>ChatGPT</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--accent)", borderBottom: "1px solid var(--border2)", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em" }}>{ru ? "Инв. Аналитик" : "AI Analyst"}</th>
                </tr>
              </thead>
              <tbody>
                {(ru ? [
                  ["RSI / технический анализ", "❌ Выдуманный", "✅ Рассчитан из реальных цен"],
                  ["Цена актива", "❌ Устаревшая / выдуманная", "✅ Реальная (Yahoo / MOEX ISS)"],
                  ["MOEX (рос. акции)", "⚠ Общий ответ", "✅ Официальный MOEX ISS API"],
                  ["Track record прогнозов", "❌ Нет", "✅ Публичный, верифицированный"],
                  ["Портфель", "❌ Нет памяти", "✅ Постоянный, с аналитикой"],
                  ["История анализов", "❌ Нет", "✅ Полная история + бэктест"],
                  ["Ценовые алерты", "❌ Нет", "✅ Telegram + email"],
                  ["Контекст ЦБ / ОФЗ / ИИС", "⚠ Устарел", "✅ Актуальный в каждом анализе"],
                  ["Сравнение нескольких активов", "⚠ Вручную", "✅ Автоматическое сравнение"],
                ] : [
                  ["RSI / technical analysis", "❌ Hallucinated", "✅ Calculated from real prices"],
                  ["Asset price", "❌ Stale / invented", "✅ Live (Yahoo Finance)"],
                  ["Historical returns 3/5/10y", "❌ Approximate", "✅ Verified from Yahoo chart"],
                  ["Forecast track record", "❌ None", "✅ Public, auto-verified"],
                  ["Portfolio", "❌ No memory", "✅ Persistent, with analytics"],
                  ["Analysis history", "❌ None", "✅ Full history + backtest"],
                  ["Price alerts", "❌ None", "✅ Telegram + email"],
                  ["Asset comparison", "⚠ Manual", "✅ Automatic side-by-side"],
                ]).map(([feature, chatgpt, ours], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border2)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--text2)" }}>{feature}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#666678" }}>{chatgpt}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#00d084", fontWeight: 600 }}>{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(0,208,132,0.05)", border: "1px solid rgba(0,208,132,0.15)", borderRadius: 8, textAlign: "center" }}>
            <span style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
              {ru
                ? "ChatGPT не публикует свои ошибки. Мы — публикуем. Каждый AI-сигнал верифицируется реальной ценой через 30 дней. Результаты индивидуальны и не гарантируют дохода."
                : "ChatGPT doesn't publish its errors. We do. Every AI signal is verified against real prices after 30 days. Results are individual and do not guarantee returns."}
            </span>
          </div>
        </div>

        {/* [I5-C] Track record on landing */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ color: "var(--accent)", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace", marginBottom: 8 }}>
              {ru ? "ВЕРИФИЦИРОВАННЫЕ ПРОГНОЗЫ" : "VERIFIED FORECASTS"}
            </div>
            <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 900, margin: 0 }}>
              {ru ? "Единственный AI-аналитик с публичным track record" : "The only AI analyst with a public track record"}
            </h2>
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 10 }}>
              {ru
                ? "Каждый buy/sell сигнал логируется автоматически. Через 30 дней проверяется реальной ценой. Результаты — публичные."
                : "Every buy/sell signal is logged automatically. Checked against real prices after 30 days. Results are public."}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { icon: "📡", label: ru ? "Авто-логирование" : "Auto-logging", desc: ru ? "Каждый анализ записывается в базу" : "Every analysis logged to database" },
              { icon: "⏱", label: ru ? "30-дневная проверка" : "30-day verification", desc: ru ? "Цена сравнивается автоматически" : "Price compared automatically" },
              { icon: "📊", label: ru ? "Публичная статистика" : "Public statistics", desc: ru ? "Точность и средний рост открыты" : "Accuracy and avg gain are open" },
              { icon: "🔒", label: ru ? "Честность" : "Honesty", desc: ru ? "Неверные прогнозы тоже показываем" : "Wrong forecasts shown too" },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--text)" }}>{label}</div>
                <div style={{ color: "var(--text3)", fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
              {ru ? "→ Смотреть текущую статистику на странице «Точность»" : "→ View current stats on the Accuracy page"}
            </span>
          </div>
        </div>

        {/* CTA bottom */}
        <div style={{ textAlign: "center", paddingBottom: 60 }}>
          <button onClick={() => setShowAuth(true)} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 12, padding: "16px 48px", color: "#07070d", fontSize: 16, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
            {ru ? "Начать бесплатно →" : "Get started free →"}
          </button>
          <div style={{ marginTop: 10, color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
            {ru ? "7 бесплатных анализов · Затем от ₽299" : "7 free analyses · Then from ₽299"}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border2)", padding: "20px 20px", textAlign: "center" }}>
        <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace", lineHeight: 1.8 }}>
          <span>© 2026 Investment Analyst · </span>
          <button onClick={() => setLegalOpen("tos")} style={{ background: "none", border: "none", color: "#666678", fontSize: 10, fontFamily: "monospace", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            {ru ? "Условия использования" : "Terms of Service"}
          </button>
          <span> · </span>
          <button onClick={() => setLegalOpen("privacy")} style={{ background: "none", border: "none", color: "#666678", fontSize: 10, fontFamily: "monospace", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            {ru ? "Политика конфиденциальности" : "Privacy Policy"}
          </button>
        </div>
        <div style={{ marginTop: 6, color: "#333344", fontSize: 9, fontFamily: "monospace" }}>
          ⚠ {ru
            ? "Анализ создан ИИ и не является инвестиционной рекомендацией. Все решения принимаются самостоятельно и на собственный риск."
            : "Analysis is generated by AI and does not constitute investment advice. All decisions are made at your own risk."}
        </div>
      </footer>

      {showAuth && <AuthModal auth={auth} lang={lang} onClose={() => setShowAuth(false)} />}
      {legalOpen && <LegalModal type={legalOpen} lang={lang} onClose={() => setLegalOpen(null)} />}
    </div>
  );
}
