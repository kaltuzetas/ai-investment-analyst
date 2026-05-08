import type { User } from "@supabase/supabase-js";
import { useState, useCallback } from "react";
import { Lang } from "@/types";
import { useReferral } from "@/hooks/useReferral";
import { supabase } from "@/lib/supabase";

interface Props {
  lang: Lang;
  user: User;
  freeRemaining: number | null;
  freeLimit: number;
  paidCredits: number | null;
  onBuyCredits: () => void;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}

function getPlanLabel(paidCredits: number | null, ru: boolean): { label: string; color: string; sub: string } {
  if (paidCredits === null) return { label: "...", color: "var(--text3)", sub: "" };
  if (paidCredits >= 100) return {
    label: ru ? "Про" : "Pro",
    color: "#8b9cf7",
    sub: ru ? "Безлимит анализов" : "Unlimited analyses",
  };
  if (paidCredits > 0) return {
    label: ru ? "Старт" : "Starter",
    color: "#c9a84c",
    sub: ru ? `Осталось ${paidCredits} из 30` : `${paidCredits} of 30 left`,
  };
  return {
    label: ru ? "Бесплатный" : "Free",
    color: "#555568",
    sub: ru ? "7 анализов при регистрации" : "7 analyses on sign-up",
  };
}

export function AccountModal({ lang, user, freeRemaining, freeLimit, paidCredits, onBuyCredits, onSignOut, onClose }: Props) {
  const ru = lang !== "en";

  const avatarUrl: string | null = (() => {
    try {
      const u = user.user_metadata?.avatar_url as string | undefined;
      if (!u) return null;
      const p = new URL(u);
      return (p.protocol === "https:" || p.protocol === "http:") ? p.href : null;
    } catch { return null; }
  })();

  const initials = (user.user_metadata?.full_name as string | undefined)
    ?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    || user.email?.[0].toUpperCase()
    || "?";

  const plan = getPlanLabel(paidCredits, ru);
  const freeUsed = freeLimit - (freeRemaining ?? freeLimit);
  const referral = useReferral(user.id);
  const freeBarWidth = freeLimit > 0 ? Math.min(100, (freeUsed / freeLimit) * 100) : 0;

  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgCodeCopied, setTgCodeCopied] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);

  const getTgCode = useCallback(async () => {
    setTgLoading(true);
    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/telegram-link", { headers });
      if (!res.ok) throw new Error("failed");
      const { code } = await res.json();
      setTgCode(code);
    } catch { setTgCode(null); }
    setTgLoading(false);
  }, []);

  const copyTgCode = useCallback(() => {
    if (!tgCode) return;
    navigator.clipboard.writeText(`/link ${tgCode}`).catch(() => {});
    setTgCodeCopied(true);
    setTimeout(() => setTgCodeCopied(false), 2000);
  }, [tgCode]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(7,7,13,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 360, padding: "24px 20px", position: "relative" }}>

        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer" }}>✕</button>

        <div style={{ color: "#c9a84c", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 18 }}>
          {ru ? "ЛИЧНЫЙ КАБИНЕТ" : "MY ACCOUNT"}
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 14px" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
            : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--border)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: 16, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
                {initials}
              </div>
            )
          }
          <div style={{ minWidth: 0 }}>
            {user.user_metadata?.full_name && (
              <div style={{ color: "var(--text)", fontSize: 13, fontFamily: "Georgia, serif", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.user_metadata.full_name as string}
              </div>
            )}
            <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Current plan */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "#444458", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 10 }}>
            {ru ? "ТЕКУЩИЙ ТАРИФ" : "CURRENT PLAN"}
          </div>
          <div style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}30`, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: plan.color, fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{plan.label}</div>
              <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{plan.sub}</div>
            </div>
            {paidCredits !== null && paidCredits === 0 && (
              <div style={{ color: "#c9a84c", fontSize: 10, fontFamily: "monospace", textAlign: "right" }}>
                {ru ? "Нет\nподписки" : "No\nsubscription"}
              </div>
            )}
          </div>
        </div>

        {/* Free analyses bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#444458", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em" }}>
              {ru ? "БЕСПЛАТНЫЕ АНАЛИЗЫ" : "FREE ANALYSES"}
            </span>
            <span style={{ color: freeRemaining === 0 ? "#ff4d4d88" : "#c9a84c88", fontSize: 10, fontFamily: "monospace" }}>
              {freeRemaining ?? "…"} / {freeLimit}
            </span>
          </div>
          <div style={{ background: "var(--border2)", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: freeBarWidth >= 100 ? "#ff4d4d66" : "linear-gradient(90deg,#c9a84c,#8b6810)", width: `${freeBarWidth}%`, transition: "width 0.4s ease" }} />
          </div>
          {freeRemaining === 0 && (
            <div style={{ color: "#ff4d4d88", fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>
              {ru ? "Бесплатные анализы исчерпаны" : "Free analyses exhausted"}
            </div>
          )}
        </div>

        {/* Referral program */}
        {referral.code && (
          <div style={{ marginBottom: 16, background: "rgba(139,156,247,0.05)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ color: "#444458", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8 }}>
              {ru ? "РЕФЕРАЛЬНАЯ ПРОГРАММА" : "REFERRAL PROGRAM"}
            </div>
            <div style={{ color: "#8b9cf7", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>
              {ru ? `+3 анализа за каждого друга · ${referral.uses} ${referral.uses === 1 ? "друг" : referral.uses < 5 ? "друга" : "друзей"} приведено` : `+3 analyses per friend · ${referral.uses} friend${referral.uses !== 1 ? "s" : ""} referred`}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ flex: 1, background: "var(--border2)", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontFamily: "monospace", color: "#555568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {referral.getReferralUrl() ?? ""}
              </div>
              <button
                onClick={referral.copyReferralUrl}
                style={{ background: referral.copied ? "rgba(0,208,132,0.15)" : "rgba(139,156,247,0.1)", border: `1px solid ${referral.copied ? "rgba(0,208,132,0.3)" : "rgba(139,156,247,0.3)"}`, color: referral.copied ? "#00d084" : "#8b9cf7", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {referral.copied ? (ru ? "✓ Скопировано" : "✓ Copied") : (ru ? "Копировать" : "Copy")}
              </button>
            </div>
          </div>
        )}

        {/* Telegram bot */}
        <div style={{ marginBottom: 16, background: "rgba(0,136,204,0.05)", border: "1px solid rgba(0,136,204,0.2)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ color: "#444458", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8 }}>
            {ru ? "TELEGRAM" : "TELEGRAM"}
          </div>
          {!tgCode ? (
            <button
              onClick={getTgCode}
              disabled={tgLoading}
              style={{ background: "rgba(0,136,204,0.1)", border: "1px solid rgba(0,136,204,0.3)", borderRadius: 7, padding: "7px 12px", color: "#0088cc", fontSize: 11, fontFamily: "monospace", cursor: tgLoading ? "default" : "pointer", opacity: tgLoading ? 0.6 : 1 }}
            >
              {tgLoading ? (ru ? "Генерируем..." : "Generating...") : (ru ? "🔗 Подключить бот" : "🔗 Connect bot")}
            </button>
          ) : (
            <div>
              <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>
                {ru ? "Отправьте боту команду:" : "Send this command to the bot:"}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ flex: 1, background: "var(--border2)", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontFamily: "monospace", color: "#0088cc", letterSpacing: "0.05em" }}>
                  /link {tgCode}
                </div>
                <button
                  onClick={copyTgCode}
                  style={{ background: tgCodeCopied ? "rgba(0,208,132,0.15)" : "rgba(0,136,204,0.1)", border: `1px solid ${tgCodeCopied ? "rgba(0,208,132,0.3)" : "rgba(0,136,204,0.3)"}`, color: tgCodeCopied ? "#00d084" : "#0088cc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {tgCodeCopied ? "✓" : (ru ? "Копировать" : "Copy")}
                </button>
              </div>
              <div style={{ color: "#444458", fontSize: 9, fontFamily: "monospace", marginTop: 5 }}>
                {ru ? "Код действителен 10 минут" : "Code valid for 10 minutes"}
              </div>
            </div>
          )}
        </div>

        {/* Upgrade button */}
        <button
          onClick={() => { onClose(); onBuyCredits(); }}
          style={{ width: "100%", background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 9, padding: "11px", color: "var(--bg)", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer", marginBottom: 10 }}
        >
          {ru ? "Подключить подписку →" : "Get subscription →"}
        </button>

        {/* Sign out */}
        <button
          onClick={async () => { await onSignOut(); onClose(); }}
          style={{ width: "100%", background: "rgba(255,77,77,0.05)", border: "1px solid rgba(255,77,77,0.15)", borderRadius: 9, padding: "10px", color: "#ff4d4d88", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
        >
          {ru ? "Выйти из аккаунта" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
