import { useState } from "react";
import { isSupabaseEnabled } from "@/lib/supabase";
import { AuthState } from "@/hooks/useAuth";
import { Spinner } from "@/components/atoms";

interface Props {
  auth: AuthState;
  lang: "ru" | "en";
  children: React.ReactNode;
}

type Mode = "login" | "signup" | "reset";

const inp = (extra?: object): React.CSSProperties => ({
  width: "100%",
  background: "var(--border2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "11px 14px",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
  boxSizing: "border-box",
  ...extra,
});

export function AuthGate({ auth, lang, children }: Props) {
  const ru = lang !== "en";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tosAccepted, setTosAccepted] = useState(false);

  if (!isSupabaseEnabled) return <>{children}</>;
  if (auth.loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }
  if (auth.user) return <>{children}</>;

  const clear = () => { setErr(null); setInfo(null); };
  const switchMode = (m: Mode) => { setMode(m); clear(); setTosAccepted(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    clear();
    setBusy(true);
    try {
      if (mode === "reset") {
        const error = await auth.resetPassword(email);
        if (error) { setErr(error); }
        else { setInfo(ru ? "Письмо отправлено! Проверьте почту." : "Email sent! Check your inbox."); }
        return;
      }
      const fn = mode === "signup" ? auth.signUpWithEmail : auth.signInWithEmail;
      const metadata = mode === "signup"
        ? { tos_accepted_at: new Date().toISOString(), tos_version: "1.0" }
        : undefined;
      const error = await fn(email, password, metadata);
      if (error) { setErr(error); }
      else if (mode === "signup") {
        setInfo(ru
          ? "Аккаунт создан! Проверьте почту для подтверждения."
          : "Account created! Check your email to confirm.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, opacity: 0.5, marginBottom: 10 }}>◎</div>
          <div style={{ fontSize: 20, color: "#c9a84c", letterSpacing: "0.04em", marginBottom: 6 }}>
            {ru ? "Инвестиционный Аналитик" : "Investment Analyst"}
          </div>
          <div style={{ color: "var(--text3)", fontSize: 12 }}>
            {mode === "login"  && (ru ? "Войдите в аккаунт" : "Sign in to your account")}
            {mode === "signup" && (ru ? "Создайте аккаунт" : "Create an account")}
            {mode === "reset"  && (ru ? "Сброс пароля" : "Reset password")}
          </div>
        </div>

        <div style={{ background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px 20px" }}>

          {/* Error / Info */}
          {err && (
            <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 7, padding: "9px 12px", marginBottom: 14, color: "#ff7070", fontSize: 12, fontFamily: "monospace" }}>
              ⚠ {err}
            </div>
          )}
          {info && (
            <div style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 7, padding: "9px 12px", marginBottom: 14, color: "#00d084", fontSize: 12, fontFamily: "monospace" }}>
              ✓ {info}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clear(); }}
              placeholder={ru ? "Email" : "Email"}
              required
              style={inp()}
            />
            {mode !== "reset" && (
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clear(); }}
                placeholder={ru ? "Пароль" : "Password"}
                required
                minLength={6}
                style={inp()}
              />
            )}
            {mode === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 11, color: "var(--text3)", fontFamily: "monospace", lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={e => setTosAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#c9a84c", flexShrink: 0 }}
                />
                {ru
                  ? "Я принимаю условия использования. Это аналитический инструмент, не инвестиционный совет."
                  : "I accept the terms of service. This is an analysis tool, not investment advice."}
              </label>
            )}
            <button
              type="submit"
              disabled={busy || (mode === "signup" && !tosAccepted)}
              style={{ background: (busy || (mode === "signup" && !tosAccepted)) ? "var(--border)" : "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 9, padding: "12px", color: (busy || (mode === "signup" && !tosAccepted)) ? "#c9a84c" : "var(--bg)", fontSize: 14, fontWeight: 700, fontFamily: "monospace", cursor: (busy || (mode === "signup" && !tosAccepted)) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {busy ? <Spinner size={16} /> : null}
              {mode === "login"  && (ru ? "Войти" : "Sign in")}
              {mode === "signup" && (ru ? "Зарегистрироваться" : "Create account")}
              {mode === "reset"  && (ru ? "Отправить письмо" : "Send reset email")}
            </button>
          </form>

          {/* Mode toggles */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, justifyContent: "center" }}>
            {mode !== "login" && (
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#c9a84c88", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
                {ru ? "← Войти" : "← Sign in"}
              </button>
            )}
            {mode === "login" && (
              <button onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "#c9a84c88", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
                {ru ? "Создать аккаунт" : "Create account"}
              </button>
            )}
            {mode === "login" && (
              <span style={{ color: "var(--text3)", fontSize: 12 }}>·</span>
            )}
            {mode !== "reset" && (
              <button onClick={() => switchMode("reset")} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
                {ru ? "Забыли пароль?" : "Forgot password?"}
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
            <span style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace" }}>{ru ? "или" : "or"}</span>
            <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
          </div>

          {/* Google — disabled until configured in Supabase */}
          <button
            disabled
            title={ru ? "Google OAuth не настроен" : "Google OAuth not configured"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "11px 20px", background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 9, color: "var(--text3)", fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif", cursor: "not-allowed" }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ opacity: 0.3 }}>
              <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.5z"/>
              <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.8 14.7 48 24 48z"/>
              <path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.8l8.1-6.2z"/>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.8-6.8C35.9 2.4 30.4 0 24 0 14.7 0 6.5 5.2 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
            </svg>
            {ru ? "Google — скоро" : "Google — coming soon"}
          </button>
        </div>

        <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          {ru
            ? "Продолжая, вы соглашаетесь с тем, что это инструмент для анализа, не инвестиционный совет."
            : "By continuing you agree this is an analysis tool, not investment advice."}
        </p>
      </div>
    </div>
  );
}
