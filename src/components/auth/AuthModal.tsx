import { useState } from "react";
import { AuthState } from "@/hooks/useAuth";
import { Spinner } from "@/components/atoms";
import { LegalModal } from "@/components/modals/LegalModal";

interface Props {
  auth: AuthState;
  lang: "ru" | "en";
  onClose: () => void;
}

type Mode = "login" | "signup" | "reset";

export function AuthModal({ auth, lang, onClose }: Props) {
  const ru = lang !== "en";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"tos" | "privacy" | null>(null);

  const clear = () => { setErr(null); setInfo(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    clear();
    setBusy(true);
    try {
      if (mode === "reset") {
        const error = await auth.resetPassword(email);
        if (error) setErr(error);
        else setInfo(ru ? "Письмо отправлено! Проверьте почту." : "Email sent! Check your inbox.");
        return;
      }
      // [M-6] При регистрации фиксируем время принятия ToS в user_metadata (требование GDPR/ФЗ-152)
      const error = mode === "signup"
        ? await auth.signUpWithEmail(email, password, {
            tos_accepted_at: new Date().toISOString(),
            tos_version: "1.0",
          })
        : await auth.signInWithEmail(email, password);
      if (error) setErr(error);
      else if (mode === "signup") {
        setInfo(ru
          ? "Аккаунт создан! Проверьте почту для подтверждения."
          : "Account created! Check your email to confirm.");
      }
      // on login success auth state changes → App re-renders → modal closes naturally
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 380, padding: "28px 24px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 32, opacity: 0.5, marginBottom: 8 }}>◎</div>
          <div style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {mode === "login"  && (ru ? "Войти в аккаунт" : "Sign in")}
            {mode === "signup" && (ru ? "Регистрация" : "Create account")}
            {mode === "reset"  && (ru ? "Сброс пароля" : "Reset password")}
          </div>
        </div>

        {err && (
          <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 7, padding: "8px 12px", marginBottom: 12, color: "#ff7070", fontSize: 12, fontFamily: "monospace" }}>
            ⚠ {err}
          </div>
        )}
        {info && (
          <div style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 7, padding: "8px 12px", marginBottom: 12, color: "#00d084", fontSize: 12, fontFamily: "monospace" }}>
            ✓ {info}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <input
            type="email" value={email} required
            onChange={e => { setEmail(e.target.value); clear(); }}
            placeholder="Email"
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px", color: "var(--text)", fontSize: 14, fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
          />
          {mode !== "reset" && (
            <input
              type="password" value={password} required minLength={6}
              onChange={e => { setPassword(e.target.value); clear(); }}
              placeholder={ru ? "Пароль (мин. 6 символов)" : "Password (min 6 chars)"}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px", color: "var(--text)", fontSize: 14, fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          )}
          {mode === "signup" && (
            <>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={e => setTosAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <span style={{ color: "#666678", fontSize: 11, lineHeight: 1.5 }}>
                  {ru ? "Я принимаю " : "I accept the "}
                  <button type="button" onClick={() => setLegalOpen("tos")} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                    {ru ? "Условия использования" : "Terms of Service"}
                  </button>
                  {ru ? " и " : " and "}
                  <button type="button" onClick={() => setLegalOpen("privacy")} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                    {ru ? "Политику конфиденциальности" : "Privacy Policy"}
                  </button>
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={ageAccepted}
                  onChange={e => setAgeAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <span style={{ color: "#666678", fontSize: 11, lineHeight: 1.5 }}>
                  {ru ? "Мне исполнилось 18 лет" : "I confirm I am 18 years of age or older"}
                </span>
              </label>
            </>
          )}
          <button
            type="submit" disabled={busy || (mode === "signup" && (!tosAccepted || !ageAccepted))}
            style={{ background: (busy || (mode === "signup" && (!tosAccepted || !ageAccepted))) ? "rgba(201,168,76,0.1)" : "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 9, padding: "12px", color: (busy || (mode === "signup" && (!tosAccepted || !ageAccepted))) ? "var(--accent)" : "#07070d", fontSize: 14, fontWeight: 700, fontFamily: "monospace", cursor: (busy || (mode === "signup" && (!tosAccepted || !ageAccepted))) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {busy && <Spinner size={16} />}
            {mode === "login"  && (ru ? "Войти" : "Sign in")}
            {mode === "signup" && (ru ? "Зарегистрироваться" : "Create account")}
            {mode === "reset"  && (ru ? "Отправить письмо" : "Send email")}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {mode !== "login" && (
            <button onClick={() => { setMode("login"); clear(); setTosAccepted(false); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
              {ru ? "← Войти" : "← Sign in"}
            </button>
          )}
          {mode === "login" && (
            <button onClick={() => { setMode("signup"); clear(); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
              {ru ? "Создать аккаунт" : "Create account"}
            </button>
          )}
          {mode !== "reset" && (
            <button onClick={() => { setMode("reset"); clear(); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
              {ru ? "Забыли пароль?" : "Forgot password?"}
            </button>
          )}
        </div>
      </div>
    </div>
    {legalOpen && <LegalModal type={legalOpen} lang={lang} onClose={() => setLegalOpen(null)} />}
    </>
  );
}
