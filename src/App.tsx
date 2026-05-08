import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { useAnalysis } from "@/hooks/useAnalysis";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHistory } from "@/hooks/useHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useInvestorProfile } from "@/hooks/useInvestorProfile";
import { useCurrency, Currency } from "@/hooks/useCurrency";
import { useAlerts } from "@/hooks/useAlerts";
import { useAuth } from "@/hooks/useAuth";
import { Header, TabId } from "@/components/layout/Header";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { ExportButtons } from "@/components/analysis/ExportButtons";
import { useShareAnalysis, stashPendingShare, popPendingShare } from "@/hooks/useShareAnalysis";
import { useReferral, popPendingRef } from "@/hooks/useReferral";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { WatchlistView } from "@/components/watchlist/WatchlistView";
import { ScreenerView } from "@/components/screener/ScreenerView";
import { CompareView } from "@/components/compare/CompareView";
import { BacktestView } from "@/components/backtest/BacktestView";
import { AccuracyPage } from "@/components/accuracy/AccuracyPage";
import { TradeJournalSection } from "@/components/portfolio/TradeJournalSection";
import { AddToPortfolioModal } from "@/components/modals/AddToPortfolioModal";
import { TinkoffImportModal } from "@/components/modals/TinkoffImportModal";
import { OnboardingModal, shouldShowOnboarding } from "@/components/modals/OnboardingModal";
import { LegalModal } from "@/components/modals/LegalModal";
import { ConsentGateModal } from "@/components/modals/ConsentGateModal";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { useConsent } from "@/hooks/useConsent";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { AccountModal } from "@/components/modals/AccountModal";
import { AuthGate } from "@/components/auth/AuthGate";
import { LandingPage } from "@/components/LandingPage";
import { SharePage } from "@/components/SharePage";
import { HistoryDropdown } from "@/components/layout/HistoryDropdown";
import { Spinner, ErrorBlock } from "@/components/atoms";
import { clearLiveCache } from "@/hooks/useLivePrice";
import { validateQuery } from "@/utils/validate";
import { CurrencyContext } from "@/contexts/CurrencyContext";
import { DEMO_TICKERS, getDemoData } from "@/constants/demoData";
import { useRequestCounter } from "@/hooks/useRequestCounter";
import { usePaidCredits } from "@/hooks/usePaidCredits";
import { ThemeProvider } from "@/contexts/ThemeContext";

const EXAMPLES = ["NVDA", "AAPL", "BTC", "ETH", "TSLA", "Nike", "SOL"];

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("ais_lang") as Lang) || "ru");
  const [tab, setTab] = useState<TabId>("analyze");
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [addModal, setAddModal] = useState<{ ticker: string; name: string; currentPrice: number | null; currency: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding());
  const [showPayment, setShowPayment] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"tos" | "privacy" | null>(null);
  const [showTinkoffImport, setShowTinkoffImport] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [shareId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("share");
    return raw && /^[a-z0-9]{6,16}$/.test(raw) ? raw : null;
  });

  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const isMobile = useIsMobile();

  // Hooks
  const auth = useAuth();
  const userId = auth.user?.id;
  const { needsConsent, recordConsent, loading: consentLoading } = useConsent(userId);
  const { remaining, FREE_LIMIT, loadError: counterLoadError, refresh: refreshCounter } = useRequestCounter(userId);
  const { credits: paidCredits, refresh: refreshPaid, buyDemo } = usePaidCredits(userId);
  const { profile, save: saveProfile } = useInvestorProfile(userId);
  const { selected: selectedCurrency, setSelected: setCurrency, convert, symbol: curSymbol } = useCurrency();
  const { alerts, add: addAlert, remove: removeAlert, hasAlert, triggered } = useAlerts(userId);
  const { portfolio, loading: portfolioLoading, addItem, removeItem, importItems, intelligence, intelligenceLoading, intelligenceError, analyzePortfolio } = usePortfolio(lang, userId);
  const { watchlist, add: addToWatchlist, remove: removeFromWatchlist, has: inWatchlist } = useWatchlist(userId);
  const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useHistory(userId);

  // Primary analysis
  const { loading, stage, stageIndex, result, error, limitReached, setLimitReached, cacheAge, analyze, setResult } = useAnalysis(lang, profile, userId);
  const { sharing, shareUrl, copied, share, copyAndClose, closeShare, loadShared } = useShareAnalysis();
  const { applyCode: applyReferralCode } = useReferral(userId);

  // Compare analyses (two independent instances)
  const cmp1 = useAnalysis(lang, profile, userId);
  const cmp2 = useAnalysis(lang, profile, userId);

  useEffect(() => { localStorage.setItem("ais_lang", lang); }, [lang]);

  // Clear price cache on user switch so stale entries don't appear for the new session
  useEffect(() => { clearLiveCache(); }, [userId]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @keyframes spin { to { transform: rotate(360deg) } }
      @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
      @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      * { box-sizing: border-box; margin: 0; padding: 0 }
      body { background: var(--bg) }
      ::-webkit-scrollbar { width: 3px }
      ::-webkit-scrollbar-thumb { background: #c9a84c33; border-radius: 2px }
      input::placeholder { color: #3a3a50 !important }
      textarea::placeholder { color: #3a3a50 !important }
      a:hover { opacity: .8 }
    `;
    document.head.appendChild(s);
    return () => { if (document.head.contains(s)) document.head.removeChild(s); };
  }, []);

  const activeQueryRef = useRef(query);
  useEffect(() => { activeQueryRef.current = query; }, [query]);

  // [FIX PAY-2] Prevent rapid double-clicks from submitting multiple requests
  // before React re-renders and disables the button.
  const analyzingRef = useRef(false);

  const handleAnalyze = (force = false, q?: string) => {
    if (needsConsent) return; // block analysis until consent is given
    const target = q ?? query;
    if (analyzingRef.current) return; // already in-flight — ignore extra clicks
    analyzingRef.current = true;
    analyze(target, force);
  };

  // Reset analyzing gate whenever loading finishes (success, error, or abort)
  useEffect(() => {
    if (!loading) analyzingRef.current = false;
  }, [loading]);

  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (result && !cacheAge) {
      pushHistory(activeQueryRef.current, result, langRef.current);
      refreshCounter();
      refreshPaid();
    }
  }, [result, cacheAge, refreshCounter, refreshPaid]);

  // Dynamic <title> and <meta description> per analysis
  useEffect(() => {
    const base = lang === "ru" ? "Инвестиционный Аналитик" : "Investment Analyst";
    if (result?.asset?.ticker) {
      const action = result.recommendation?.action ?? "watch";
      const actionLabel = lang === "ru"
        ? { buy: "Покупать", hold: "Держать", sell: "Продавать", watch: "Наблюдать" }[action] ?? action
        : { buy: "Buy", hold: "Hold", sell: "Sell", watch: "Watch" }[action] ?? action;
      document.title = `${result.asset.ticker} — ${actionLabel} · ${base}`;
      const desc = document.querySelector("meta[name='description']");
      if (desc) desc.setAttribute("content", result.recommendation?.summary?.slice(0, 155) ?? "");
    } else {
      document.title = base;
    }
  }, [result, lang]);

  // Auto-open payment modal when free limit is exhausted
  useEffect(() => {
    if (limitReached) {
      setShowPayment(true);
      setLimitReached(false);
    }
  }, [limitReached, setLimitReached]);

  // Detect return from ЮКасса payment page (?payment=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      refreshPaid();
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 6000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load shared analysis / apply referral after auth resolves
  useEffect(() => {
    if (!userId) return;
    const pendingShare = popPendingShare();
    if (pendingShare) {
      loadShared(pendingShare).then(res => {
        if (res) { setResult(res.data); setTab("analyze"); }
      });
    }
    const pendingRef = popPendingRef();
    if (pendingRef) {
      applyReferralCode(pendingRef).then(ok => {
        if (ok) refreshPaid(); // refresh balance after bonus credits
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const queryValid = validateQuery(query).valid;
  const queryTouched = query.trim().length > 0;
  const inPort = result && portfolio.some(p => p.ticker === result.asset?.ticker);

  const openAddModal = () => {
    if (!result) return;
    setAddModal({ ticker: result.asset?.ticker ?? "", name: result.asset?.name ?? "", currentPrice: result.valuation?.currentPrice ?? null, currency: result.valuation?.currency ?? "USD" });
  };

  const handleConfirmAdd = (qty: number | null, price: number | null) => {
    if (!addModal || !result) return;
    if (portfolio.find(p => p.ticker === addModal.ticker)) { setAddModal(null); return; }
    addItem(addModal.ticker, addModal.name, addModal.currency, qty, price, result);
    setAddModal(null);
  };

  const goAnalyzeWith = (ticker: string) => { setQuery(ticker); setTab("analyze"); handleAnalyze(false, ticker); };

  const loadDemo = (ticker: string) => {
    const data = getDemoData(lang)[ticker];
    if (!data) return;
    setQuery(ticker);
    setTab("analyze");
    setResult(data);
    // intentionally NOT pushing to history — demo data must not pollute the user's real history
  };

  // Not logged in → shared analysis page OR landing page
  if (!auth.loading && !auth.user) {
    if (shareId) {
      return (
        <ThemeProvider>
          <SharePage
            shareId={shareId}
            lang={lang}
            onSignUp={() => {
              try { sessionStorage.setItem("ais_pending_share", shareId); } catch {}
              window.history.replaceState({}, "", window.location.pathname);
              window.location.reload();
            }}
          />
        </ThemeProvider>
      );
    }
    return (
      <ThemeProvider>
        <CurrencyContext.Provider value={{ selected: selectedCurrency, convert, symbol: curSymbol }}>
          <LandingPage lang={lang} auth={auth} onLangChange={setLang} />
        </CurrencyContext.Provider>
      </ThemeProvider>
    );
  }

  return (
    <AuthGate auth={auth} lang={lang}>
    <ThemeProvider>
    <CurrencyContext.Provider value={{ selected: selectedCurrency, convert, symbol: curSymbol }}>
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Georgia, serif" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 40% at 50% 0%,rgba(201,168,76,0.05) 0%,transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: 960, margin: "0 auto", padding: isMobile ? "16px 10px 60px" : "28px 16px 80px" }}>

          <Header
            lang={lang}
            tab={tab}
            portfolioCount={portfolio.length}
            watchlistCount={watchlist.length}
            alertCount={triggered.length}
            user={auth.user}
            onLangChange={setLang}
            onTabChange={setTab}
            onSettingsOpen={() => setShowSettings(true)}
            onAccountOpen={() => setShowAccount(true)}
          />

          {/* Payment success banner */}
          {paymentSuccess && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ color: "#00d084", fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                  {lang === "ru" ? "Оплата прошла успешно!" : "Payment successful!"}
                </div>
                <div style={{ color: "#00d08488", fontSize: 11, fontFamily: "monospace" }}>
                  {lang === "ru" ? "Кредиты зачислены на счёт — можно анализировать." : "Credits added to your account — start analyzing."}
                </div>
              </div>
              <button onClick={() => setPaymentSuccess(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#00d08466", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* ── АНАЛИЗ ───────────────────────────────────── */}
          {tab === "analyze" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <HistoryDropdown history={history} lang={lang} onSelect={q => { setQuery(q); handleAnalyze(false, q); }} onRemove={removeHistory} onClear={clearHistory} />
                </div>
                <div style={{ display: "flex", gap: 10, background: "var(--border2)", border: `1px solid ${queryTouched && !queryValid ? "rgba(255,77,77,0.5)" : "rgba(201,168,76,0.25)"}`, borderRadius: 12, padding: 8, transition: "border-color 0.2s" }}>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                    placeholder={t("searchPh")}
                    maxLength={60}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, padding: "8px 14px", fontFamily: "Georgia, serif" }}
                  />
                  {queryTouched && <div style={{ display: "flex", alignItems: "center", paddingRight: 4 }}><span style={{ fontSize: 16 }}>{queryValid ? "✓" : "✗"}</span></div>}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={loading || !queryValid}
                      style={{ background: loading ? "var(--border)" : !queryValid && queryTouched ? "rgba(255,77,77,0.15)" : "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 8, padding: isMobile ? "8px 14px" : "8px 24px", color: loading ? "#c9a84c" : !queryValid && queryTouched ? "#ff7070" : "var(--bg)", fontSize: 13, fontWeight: 700, cursor: loading || !queryValid ? "not-allowed" : "pointer", fontFamily: "monospace", minWidth: isMobile ? 70 : 110, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      {loading ? <><Spinner size={16} /><span style={{ fontSize: 11 }}>...</span></> : t("analyzeBtn")}
                    </button>
                    {/* Credits counter */}
                    {!userId ? (
                      <div style={{ fontSize: 10, fontFamily: "monospace", textAlign: "center", color: "#ff4d4d88" }}>
                        {t("reqNeedLogin")}
                      </div>
                    ) : counterLoadError ? (
                      <button
                        onClick={refreshCounter}
                        title={lang === "ru" ? "Ошибка загрузки баланса — нажмите для повтора" : "Failed to load balance — click to retry"}
                        style={{ fontSize: 10, fontFamily: "monospace", background: "none", border: "none", cursor: "pointer", color: "#ff7070", padding: 0 }}
                      >
                        {lang === "ru" ? "↺ ошибка" : "↺ error"}
                      </button>
                    ) : remaining !== null && remaining > 0 ? (
                      <div style={{
                        fontSize: 11, fontFamily: "monospace", textAlign: "center",
                        color: remaining === 1 ? "#ff7a3d" : remaining <= 3 ? "#f5a623" : "#c9a84c",
                        background: remaining <= 3 ? `rgba(${remaining === 1 ? "255,122,61" : "245,166,35"},0.08)` : "transparent",
                        border: remaining <= 3 ? `1px solid rgba(${remaining === 1 ? "255,122,61" : "245,166,35"},0.25)` : "none",
                        borderRadius: 6, padding: remaining <= 3 ? "3px 8px" : 0,
                      }}>
                        {remaining <= 3 && "⚠ "}{remaining} {t("reqCounter")}
                      </div>
                    ) : paidCredits !== null && paidCredits > 0 ? (
                      <div style={{ fontSize: 11, fontFamily: "monospace", textAlign: "center", color: "#00d084", background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 6, padding: "3px 8px" }}>
                        {paidCredits} {lang === "ru" ? "анализов" : "analyses"}
                      </div>
                    ) : remaining !== null ? (
                      <button
                        onClick={() => setShowPayment(true)}
                        style={{ fontSize: 11, fontFamily: "monospace", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "#c9a84c" }}
                      >
                        {lang === "ru" ? "↑ Подключить подписку" : "↑ Get subscription"}
                      </button>
                    ) : (
                      <div style={{ fontSize: 10, fontFamily: "monospace", textAlign: "center", color: "var(--text3)" }}>...</div>
                    )}
                  </div>
                </div>
                {queryTouched && !queryValid && (
                  <div style={{ color: "#ff6060", fontSize: 11, fontFamily: "monospace", marginTop: 6, paddingLeft: 14 }}>
                    ⚠ {lang === "ru" ? "Введите тикер или название (AAPL, Tesla, Bitcoin...)" : "Enter a ticker or name (AAPL, Tesla, Bitcoin...)"}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", alignItems: "center", paddingBottom: isMobile ? 4 : 0 }}>
                <span style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>→</span>
                {EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => setQuery(ex)} style={{ background: "rgba(201,168,76,0.05)", border: "1px solid var(--border)", color: "#c9a84c88", borderRadius: 20, padding: "3px 12px", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{ex}</button>
                ))}
              </div>

              {/* Демо-режим */}
              <div style={{ display: "flex", gap: 8, marginBottom: 28, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em" }}>DEMO</span>
                {DEMO_TICKERS.map(ticker => (
                  <button key={ticker} onClick={() => loadDemo(ticker)} style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.25)", color: "#8b9cf7", borderRadius: 20, padding: "3px 14px", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                    {ticker}
                  </button>
                ))}
                <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{lang === "ru" ? "← демо данные" : "← demo data"}</span>
              </div>

              {loading && (
                <div style={{ padding: "40px 20px", animation: "fadeUp 0.4s ease" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Spinner size={36} /></div>
                  <div style={{ maxWidth: 400, margin: "0 auto 16px", background: "var(--border2)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#c9a84c,#8b9cf7)", width: `${Math.round((stageIndex / 6) * 100)}%`, transition: "width 1.2s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                    {[...(TR[lang]?.stages ?? TR.ru.stages)].map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < stageIndex ? "#c9a84c" : i === stageIndex - 1 ? "#8b9cf7" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />
                    ))}
                  </div>
                  <div style={{ textAlign: "center", color: "#c9a84c", fontSize: 12, letterSpacing: "0.12em", fontFamily: "monospace" }}>{stage || [...(TR[lang]?.stages ?? TR.ru.stages)][0]}</div>
                  <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 11, marginTop: 6, fontStyle: "italic" }}>{t("loadingSub")}</div>
                </div>
              )}

              {error && !loading && <ErrorBlock error={error} lang={lang} onRetry={() => handleAnalyze()} />}

              {result && !loading && (
                <div>
                  {cacheAge && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(139,156,247,0.06)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 14 }}>
                      <span style={{ color: "#8b9cf7", fontSize: 11, fontFamily: "monospace" }}>📦 {lang === "ru" ? `Данные из кэша · ${cacheAge}` : `Cached · ${cacheAge}`}</span>
                      <button onClick={() => handleAnalyze(true)} style={{ background: "rgba(139,156,247,0.15)", border: "1px solid rgba(139,156,247,0.3)", color: "#8b9cf7", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>
                        {lang === "ru" ? "↺ Обновить" : "↺ Refresh"}
                      </button>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <ExportButtons data={result} lang={lang} />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {shareUrl ? (
                        <>
                          <div style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.25)", borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 8, maxWidth: isMobile ? 160 : 280 }}>
                            <span style={{ color: "#00d08488", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{shareUrl}</span>
                          </div>
                          <button
                            onClick={() => copyAndClose(shareUrl)}
                            style={{ background: copied ? "rgba(0,208,132,0.15)" : "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.3)", color: "#00d084", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap" }}
                          >
                            {copied ? (lang === "ru" ? "✓ Скопировано" : "✓ Copied") : (lang === "ru" ? "Копировать" : "Copy")}
                          </button>
                          <button onClick={closeShare} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
                        </>
                      ) : (
                        <button
                          onClick={() => share(result, lang, userId)}
                          disabled={sharing || !result}
                          style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.25)", color: sharing ? "var(--text3)" : "#8b9cf7", borderRadius: 8, padding: "5px 14px", cursor: sharing ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}
                        >
                          {sharing ? "..." : (lang === "ru" ? "⤴ Поделиться" : "⤴ Share")}
                        </button>
                      )}
                    </div>
                  </div>
                  <AnalysisView data={result} lang={lang} cacheAge={cacheAge} onRefresh={() => analyze(result.asset?.ticker ?? "", true)} />
                  <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {!inPort
                      ? <button onClick={openAddModal} style={{ background: "rgba(0,208,132,0.1)", border: "1px solid rgba(0,208,132,0.3)", color: "#00d084", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 600 }}>{t("addBtn")}</button>
                      : <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 20px", color: "#c9a84c", fontSize: 12, fontFamily: "monospace" }}>{t("inPort")}</div>
                    }
                    {result.asset?.ticker && (
                      inWatchlist(result.asset.ticker)
                        ? <div style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 8, padding: "10px 20px", color: "#8b9cf7", fontSize: 12, fontFamily: "monospace" }}>{t("wlInList")}</div>
                        : <button onClick={() => addToWatchlist(result.asset.ticker, result.asset.name, result.asset.assetClass ?? "", result.recommendation?.action ?? "watch")} style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.25)", color: "#8b9cf7", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>{t("wlAdd")}</button>
                    )}
                    {result.asset?.ticker && (
                      hasAlert(result.asset.ticker)
                        ? <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: 8, padding: "10px 20px", color: "#f5a623", fontSize: 12, fontFamily: "monospace" }}>{t("alAlertSet")}</div>
                        : <button onClick={() => addAlert(result.asset.ticker, result.asset.name, lang)} style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", color: "#f5a623", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>{t("alSetAlert")}</button>
                    )}
                  </div>
                </div>
              )}

              {!result && !loading && !error && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 44, marginBottom: 14, opacity: .4 }}>◎</div>
                  <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--text3)" }}>{t("emptySearch")}</div>
                  <div style={{ fontSize: 12, marginTop: 8, color: "var(--text3)" }}>{t("emptySearchSub")}</div>
                </div>
              )}
            </div>
          )}

          {/* ── ПОРТФЕЛЬ ─────────────────────────────────── */}
          {tab === "portfolio" && (
            <div>
              <PortfolioView
                lang={lang}
                onGoAnalyze={() => setTab("analyze")}
                portfolio={portfolio}
                loading={portfolioLoading}
                intelligence={intelligence}
                intelligenceLoading={intelligenceLoading}
                intelligenceError={intelligenceError}
                removeItem={removeItem}
                analyzePortfolio={analyzePortfolio}
                onImportTinkoff={() => setShowTinkoffImport(true)}
                isAuthenticated={!!userId}
              />
              <div style={{ marginTop: 32, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                <button
                  onClick={() => setShowJournal(j => !j)}
                  style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, fontFamily: "monospace", cursor: "pointer", marginBottom: showJournal ? 16 : 0 }}
                >
                  {showJournal ? "▼" : "▶"} {t("jrTitle")}
                </button>
                {showJournal && <TradeJournalSection lang={lang} userId={userId} />}
              </div>
            </div>
          )}

          {/* ── ВОТЧЛИСТ ─────────────────────────────────── */}
          {tab === "watchlist" && (
            <div>
              {triggered.length > 0 && (
                <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ color: "#ff7070", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>🔴 {t("alTriggered")} ({triggered.length})</div>
                  {triggered.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ color: "#ff9090", fontSize: 13, fontFamily: "monospace" }}>{a.ticker} — {t("alBuyZone")}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => goAnalyzeWith(a.ticker)} style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", color: "#ff7070", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>→</button>
                        <button onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: "#ff4d4d44", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <WatchlistView lang={lang} onGoAnalyze={() => setTab("analyze")} onSelectTicker={goAnalyzeWith} watchlist={watchlist} onRemove={removeFromWatchlist} />
            </div>
          )}

          {/* ── СКРИНЕР ──────────────────────────────────── */}
          {tab === "screener" && (
            <ScreenerView lang={lang} onAnalyze={ticker => { goAnalyzeWith(ticker); }} userId={userId} />
          )}

          {/* ── СРАВНЕНИЕ ────────────────────────────────── */}
          {tab === "compare" && (
            <CompareView
              lang={lang}
              userId={userId}
              analyze1={q => cmp1.analyze(q)}
              analyze2={q => cmp2.analyze(q)}
              setResult1={cmp1.setResult}
              setResult2={cmp2.setResult}
              result1={cmp1.result}
              result2={cmp2.result}
              loading1={cmp1.loading}
              loading2={cmp2.loading}
              error1={cmp1.error}
              error2={cmp2.error}
            />
          )}

          {/* ── БЭКТЕСТ ──────────────────────────────────── */}
          {tab === "backtest" && (
            <BacktestView lang={lang} history={history} onAnalyze={goAnalyzeWith} userId={userId} />
          )}

          {/* ── ТОЧНОСТЬ ─────────────────────────────────── */}
          {tab === "accuracy" && (
            <AccuracyPage lang={lang} userId={userId} />
          )}

          {/* Footer disclaimer */}
          <div style={{ marginTop: 40, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 12, textAlign: "center" }}>
            <div style={{ marginBottom: 6, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setLegalOpen("tos")} style={{ background: "none", border: "none", color: "#444456", fontSize: 9, fontFamily: "monospace", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                {lang === "ru" ? "Условия использования" : "Terms of Service"}
              </button>
              <span style={{ color: "#333344", fontSize: 9 }}>·</span>
              <button onClick={() => setLegalOpen("privacy")} style={{ background: "none", border: "none", color: "#444456", fontSize: 9, fontFamily: "monospace", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                {lang === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
              </button>
            </div>
            <span style={{ color: "#333344", fontSize: 9, fontFamily: "monospace", lineHeight: 1.5 }}>
              ⚠ {t("disclaimer")}
            </span>
          </div>
        </div>

        {/* ADD TO PORTFOLIO MODAL */}
        {addModal && (
          <AddToPortfolioModal modal={addModal} lang={lang} onConfirm={handleConfirmAdd} onClose={() => setAddModal(null)} />
        )}

        {/* TINKOFF IMPORT MODAL */}
        {showTinkoffImport && (
          <TinkoffImportModal
            lang={lang}
            onImport={(items) => { importItems(items); setTab("portfolio"); }}
            onClose={() => setShowTinkoffImport(false)}
          />
        )}

        {/* SETTINGS MODAL */}
        {showSettings && (
          <SettingsModal
            lang={lang}
            profile={profile}
            selectedCurrency={selectedCurrency}
            user={auth.user}
            onSave={(p, c) => { saveProfile(p); setCurrency(c as Currency); }}
            onClose={() => setShowSettings(false)}
            onSignOut={auth.signOut}
          />
        )}

        {/* ACCOUNT MODAL */}
        {showAccount && auth.user && (
          <AccountModal
            lang={lang}
            user={auth.user}
            freeRemaining={remaining}
            freeLimit={FREE_LIMIT}
            paidCredits={paidCredits}
            onBuyCredits={() => setShowPayment(true)}
            onSignOut={auth.signOut}
            onClose={() => setShowAccount(false)}
          />
        )}

        {/* PAYMENT MODAL */}
        {showPayment && (
          <PaymentModal
            lang={lang}
            currentCredits={paidCredits ?? 0}
            onBuy={async (credits) => {
              try {
                await buyDemo(credits);
              } finally {
                // [FIX M-3] Обновляем баланс даже при ошибке — кредиты могли быть
                // добавлены в БД до того как ответ дошёл до клиента.
                refreshPaid();
              }
            }}
            onClose={() => setShowPayment(false)}
          />
        )}

        {/* ONBOARDING */}
        {showOnboarding && <OnboardingModal lang={lang} profile={profile} onSaveProfile={saveProfile} onClose={() => setShowOnboarding(false)} onAnalyze={(ticker) => { setTab("analyze"); analyze(ticker); }} />}

        {/* LEGAL */}
        {legalOpen && <LegalModal type={legalOpen} lang={lang} onClose={() => setLegalOpen(null)} />}

        {/* COOKIE BANNER */}
        {!needsConsent && <CookieBanner lang={lang} onOpenPrivacy={() => setLegalOpen("privacy")} />}

        {/* CONSENT GATE — must accept ToS before using the app */}
        {needsConsent && (
          <ConsentGateModal
            lang={lang}
            onAccept={recordConsent}
            onOpenTos={() => setLegalOpen("tos")}
            onOpenPrivacy={() => setLegalOpen("privacy")}
            loading={consentLoading}
          />
        )}
      </div>
    </CurrencyContext.Provider>
    </ThemeProvider>
    </AuthGate>
  );
}
