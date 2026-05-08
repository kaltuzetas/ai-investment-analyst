import { useState } from "react";
import { Lang } from "@/types";
import { supabase } from "@/lib/supabase";

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: number;          // monthly credits
  features: string[];
  color: string;
  best?: boolean;
}

const PLANS: Record<Lang, Plan[]> = {
  ru: [
    {
      id: "start",
      name: "Старт",
      monthlyPrice: 299,
      annualPrice: 2490,
      credits: 30,
      color: "#c9a84c",
      features: [
        "30 анализов в месяц",
        "Портфель и вотчлист",
        "История и бэктест",
        "Сравнение активов",
        "Поддержка по email",
      ],
    },
    {
      id: "pro",
      name: "Про",
      monthlyPrice: 699,
      annualPrice: 5990,
      credits: 100,
      color: "#8b9cf7",
      best: true,
      features: [
        "100 анализов в месяц",
        "Портфель и вотчлист",
        "Скринер + сравнение",
        "Приоритетный доступ",
        "Ранний доступ к функциям",
      ],
    },
    {
      id: "media",
      name: "Медиа / Канал",
      monthlyPrice: 2990,
      annualPrice: 24900,
      credits: 500,
      color: "#e67e22",
      features: [
        "500 анализов в месяц",
        "Белый лейбл (без брендинга)",
        "Экспорт для Telegram / соцсети",
        "API-доступ (50 req/день)",
        "Приоритетная поддержка",
      ],
    },
  ],
  en: [
    {
      id: "start",
      name: "Starter",
      monthlyPrice: 299,
      annualPrice: 2490,
      credits: 30,
      color: "#c9a84c",
      features: [
        "30 analyses per month",
        "Portfolio & watchlist",
        "History & backtest",
        "Compare assets",
        "Email support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 699,
      annualPrice: 5990,
      credits: 100,
      color: "#8b9cf7",
      best: true,
      features: [
        "100 analyses per month",
        "Portfolio & watchlist",
        "Screener + compare",
        "Priority access",
        "Early access to features",
      ],
    },
    {
      id: "media",
      name: "Media / Channel",
      monthlyPrice: 2990,
      annualPrice: 24900,
      credits: 500,
      color: "#e67e22",
      features: [
        "500 analyses per month",
        "White-label (no branding)",
        "Export for Telegram / social",
        "API access (50 req/day)",
        "Priority support",
      ],
    },
  ],
};

interface Props {
  lang: Lang;
  currentCredits: number;
  onBuy: (credits: number) => Promise<void>;
  onClose: () => void;
}

export function PaymentModal({ lang, currentCredits, onBuy, onClose }: Props) {
  const plans = PLANS[lang] ?? PLANS.ru;
  const ru = lang !== "en";
  const [selected, setSelected] = useState<string>("pro");
  const [annual, setAnnual] = useState(false);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  const plan = plans.find(p => p.id === selected) ?? plans[1];

  // Derived price & plan ID sent to API
  const displayPrice = annual ? plan.annualPrice : plan.monthlyPrice;
  const apiPlanId    = annual ? `${plan.id}_annual` : plan.id;
  const priceLabel   = `₽${displayPrice.toLocaleString("ru-RU")}`;
  const periodLabel  = annual
    ? (ru ? "/ год" : "/ year")
    : (ru ? "/ месяц" : "/ month");
  const perMonthNote = annual
    ? (ru
        ? `₽${Math.round(plan.annualPrice / 12).toLocaleString("ru-RU")}/мес`
        : `₽${Math.round(plan.annualPrice / 12).toLocaleString("en-US")}/mo`)
    : null;
  const savePercent = Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100);

  const handleBuy = async () => {
    if (buying) return;
    setBuying(true);
    setErr(null);
    try {
      if (!supabase) throw new Error(ru ? "Сервис недоступен" : "Service unavailable");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ru ? "Необходима авторизация" : "Authorization required");
      const res = await fetch("/api/payment/yookassa/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: apiPlanId }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.confirmationUrl) {
        setAwaitingPayment(true);
        window.open(json.confirmationUrl, "_blank", "noopener");
        setBuying(false);
        return;
      }
      throw new Error(json.error || (ru ? `Ошибка оплаты (${res.status})` : `Payment error (${res.status})`));
    } catch (e) {
      setErr((e as Error).message || (ru ? "Ошибка оплаты" : "Payment error"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(7,7,13,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 16, width: "100%", maxWidth: 500, padding: "28px 24px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>

        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer" }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
          <div style={{ color: "#c9a84c", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif", marginBottom: 4 }}>
            {ru ? "Выберите тариф" : "Choose your plan"}
          </div>
          <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>
            {ru ? "7 бесплатных анализов уже использованы — выберите тариф для продолжения" : "7 free analyses used — choose a plan to continue"}
          </div>
          {currentCredits > 0 && (
            <div style={{ marginTop: 6, color: "#c9a84c88", fontSize: 11, fontFamily: "monospace" }}>
              {ru ? `Текущий остаток: ${currentCredits} попыток` : `Current balance: ${currentCredits} credits`}
            </div>
          )}
        </div>

        {/* Billing period toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: 3, gap: 2, position: "relative" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ background: !annual ? "var(--border)" : "transparent", border: "none", borderRadius: 6, padding: "5px 16px", cursor: "pointer", color: !annual ? "var(--text)" : "var(--text3)", fontSize: 12, fontFamily: "monospace", fontWeight: !annual ? 700 : 400 }}
            >
              {ru ? "Ежемесячно" : "Monthly"}
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ background: annual ? "var(--border)" : "transparent", border: "none", borderRadius: 6, padding: "5px 16px", cursor: "pointer", fontSize: 12, fontFamily: "monospace", fontWeight: annual ? 700 : 400, color: annual ? "var(--text)" : "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}
            >
              {ru ? "Ежегодно" : "Annually"}
              <span style={{ background: "rgba(0,208,132,0.15)", border: "1px solid rgba(0,208,132,0.3)", borderRadius: 10, padding: "1px 6px", color: "#00d084", fontSize: 9, fontWeight: 700 }}>
                -{savePercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {plans.map(p => {
            const active = selected === p.id;
            const cardPrice = annual ? p.annualPrice : p.monthlyPrice;
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); setSuccess(null); setErr(null); }}
                style={{
                  background: active ? `${p.color}10` : "var(--border2)",
                  border: `2px solid ${active ? p.color : p.best ? `${p.color}40` : "var(--border2)"}`,
                  borderRadius: 12, padding: "16px 14px", cursor: "pointer", position: "relative",
                  textAlign: "left", transition: "border-color 0.15s, background 0.15s",
                }}
              >
                {p.best && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: p.color, color: "var(--bg)", fontSize: 8, fontWeight: 700, fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
                    {ru ? "ПОПУЛЯРНЫЙ" : "POPULAR"}
                  </div>
                )}
                <div style={{ color: p.color, fontSize: 14, fontWeight: 700, fontFamily: "monospace", marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: annual ? 2 : 10 }}>
                  <span style={{ color: active ? p.color : "var(--text)", fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>
                    ₽{cardPrice.toLocaleString("ru-RU")}
                  </span>
                  <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{periodLabel}</span>
                </div>
                {annual && (
                  <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace", marginBottom: 10 }}>
                    ≈ ₽{Math.round(p.annualPrice / 12).toLocaleString("ru-RU")}{ru ? "/мес" : "/mo"}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
                      <span style={{ color: p.color, fontSize: 9, marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span style={{ color: "#666678", fontSize: 10, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        {awaitingPayment ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
            <div style={{ color: "#c9a84c", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: 6 }}>
              {ru ? "Страница оплаты открыта" : "Payment page opened"}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", marginBottom: 16, lineHeight: 1.6 }}>
              {ru
                ? "Завершите оплату в новой вкладке. После успешной оплаты вернитесь сюда и закройте это окно."
                : "Complete payment in the new tab. After successful payment, return here and close this window."}
            </div>
            <button onClick={onClose} style={{ background: "var(--border)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}>
              {ru ? "Я оплатил — закрыть" : "Paid — close"}
            </button>
          </div>
        ) : success !== null ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ color: "#00d084", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: 4 }}>
              {ru ? `Тариф «${success}» активирован!` : `«${success}» plan activated!`}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", marginBottom: 16 }}>
              {ru ? "Попытки уже доступны" : "Credits are ready to use"}
            </div>
            <button
              onClick={onClose}
              style={{ background: "var(--border)", border: "1px solid rgba(201,168,76,0.35)", color: "#c9a84c", borderRadius: 8, padding: "10px 28px", cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}
            >
              {ru ? "Готово" : "Done"}
            </button>
          </div>
        ) : (
          <>
            {err && (
              <div style={{ color: "#ff7070", fontSize: 11, fontFamily: "monospace", marginBottom: 8, background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 6, padding: "6px 10px" }}>
                ⚠ {err}
              </div>
            )}
            <button
              onClick={handleBuy}
              disabled={buying}
              style={{
                width: "100%", padding: "14px", borderRadius: 10, border: "none",
                cursor: buying ? "not-allowed" : "pointer",
                background: buying ? "var(--border)" : `linear-gradient(135deg,${plan.color},${plan.id === "pro" ? "#5566cc" : "#8b6810"})`,
                color: buying ? plan.color : "var(--bg)", fontSize: 14, fontWeight: 700, fontFamily: "monospace",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {buying
                ? (ru ? "Обработка..." : "Processing...")
                : (ru
                    ? `Оплатить ${priceLabel} → ${plan.name}${annual ? " (год)" : ""}`
                    : `Pay ${priceLabel} → ${plan.name}${annual ? " (annual)" : ""}`)}
            </button>
            {annual && perMonthNote && (
              <div style={{ textAlign: "center", marginTop: 6, color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
                {ru ? `${perMonthNote} · экономия ₽${(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString("ru-RU")} в год` : `${perMonthNote} · save ₽${(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString("en-US")}/year`}
              </div>
            )}
            {/* Refund & no-auto-renewal disclosure — ЗоПП ст.26.1 */}
            <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border2)", borderRadius: 7 }}>
              <div style={{ color: "#555566", fontSize: 9, fontFamily: "monospace", lineHeight: 1.7 }}>
                {ru
                  ? "ℹ Покупка кредитов — разовая. Автоматического списания нет. Кредиты не имеют срока истечения. Возврат неиспользованных кредитов возможен в течение 14 дней при использовании не более 20% объёма — обратитесь в поддержку. Оказанные информационные услуги (использованные кредиты) возврату не подлежат."
                  : "ℹ Credit purchase is one-time. No auto-renewal or recurring charges. Credits do not expire. Refunds on unused credits available within 14 days if ≤20% used — contact support. Consumed credits (delivered information services) are non-refundable."}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
