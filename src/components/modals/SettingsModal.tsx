import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { InvestorProfile } from "@/hooks/useInvestorProfile";
import { Currency, CURRENCIES, CURRENCY_SYMBOL } from "@/hooks/useCurrency";
import { isSupabaseEnabled } from "@/lib/supabase";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useApiKeys } from "@/hooks/useApiKeys";

interface Props {
  lang: Lang;
  profile: InvestorProfile;
  selectedCurrency: Currency;
  user?: User | null;
  onSave: (profile: InvestorProfile, currency: Currency) => void;
  onClose: () => void;
  onSignOut?: () => Promise<void>;
}

const row = (style?: object) => ({
  marginBottom: 20,
  ...style,
});

const label = {
  color: "#666678",
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: "0.1em",
  marginBottom: 8,
  display: "block" as const,
};

function OptionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--border)" : "var(--border2)",
        border: `1px solid ${active ? "rgba(201,168,76,0.5)" : "var(--border2)"}`,
        color: active ? "#c9a84c" : "#555568",
        borderRadius: 7,
        padding: "7px 14px",
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "monospace",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export function SettingsModal({ lang, profile, selectedCurrency, user, onSave, onClose, onSignOut }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const [p, setP] = useState<InvestorProfile>(profile);
  const [cur, setCur] = useState<Currency>(selectedCurrency);
  const { prefs, saving: prefsSaving, save: savePrefs } = useUserPreferences(user?.id);
  const { keys: apiKeys, loading: keysLoading, error: keysError, newRawKey, createKey, revokeKey, clearNewKey } = useApiKeys(user?.id);
  const [newKeyName, setNewKeyName] = useState("");
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 24px", maxWidth: 460, width: "100%", animation: "fadeUp 0.25s ease both", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ color: "#c9a84c", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.1em" }}>{t("sfTitle")}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Horizon */}
        <div style={row()}>
          <span style={label}>{t("sfHorizon").toUpperCase()}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["short", "medium", "long"] as const).map(h => (
              <OptionBtn key={h} active={p.horizon === h} onClick={() => setP({ ...p, horizon: h })}>
                {t({ short: "sfHorizShort", medium: "sfHorizMed", long: "sfHorizLong" }[h])}
              </OptionBtn>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div style={row()}>
          <span style={label}>{t("sfRisk").toUpperCase()}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["conservative", "moderate", "aggressive"] as const).map(r => (
              <OptionBtn key={r} active={p.risk === r} onClick={() => setP({ ...p, risk: r })}>
                {t({ conservative: "sfRiskCons", moderate: "sfRiskMod", aggressive: "sfRiskAgg" }[r])}
              </OptionBtn>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div style={row()}>
          <span style={label}>{t("sfGoal").toUpperCase()}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["income", "growth", "speculation"] as const).map(g => (
              <OptionBtn key={g} active={p.goal === g} onClick={() => setP({ ...p, goal: g })}>
                {t({ income: "sfGoalIncome", growth: "sfGoalGrowth", speculation: "sfGoalSpec" }[g])}
              </OptionBtn>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div style={row({ marginBottom: 28 })}>
          <span style={label}>{t("sfCurrency").toUpperCase()}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CURRENCIES.map(c => (
              <OptionBtn key={c} active={cur === c} onClick={() => setCur(c)}>
                {CURRENCY_SYMBOL[c]} {c}
              </OptionBtn>
            ))}
          </div>
        </div>

        {/* Account — shown when Supabase auth is active */}
        {isSupabaseEnabled && user && (
          <div style={{ borderTop: "1px solid var(--border2)", paddingTop: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#444458", letterSpacing: "0.1em", marginBottom: 4 }}>АККАУНТ</div>
                <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "monospace" }}>
                  {user.user_metadata?.avatar_url && (() => {
                    try {
                      const p = new URL(user.user_metadata.avatar_url as string);
                      if (p.protocol === "https:" || p.protocol === "http:")
                        return <img src={p.href} alt="" style={{ width: 18, height: 18, borderRadius: "50%", verticalAlign: "middle", marginRight: 8 }} />;
                    } catch { /* invalid URL — skip */ }
                    return null;
                  })()}
                  {user.email}
                </div>
              </div>
              {onSignOut && (
                <button
                  onClick={async () => { await onSignOut?.(); onClose(); }}
                  style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", color: "#ff4d4d88", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap" }}
                >
                  {lang === "ru" ? "Выйти" : "Sign out"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email notifications — only when Supabase auth is active */}
        {isSupabaseEnabled && user && (
          <div style={{ borderTop: "1px solid var(--border2)", paddingTop: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#444458", letterSpacing: "0.1em", marginBottom: 12 }}>
              {lang === "ru" ? "EMAIL-УВЕДОМЛЕНИЯ" : "EMAIL NOTIFICATIONS"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "emailAlerts" as const, labelRu: "Алерты о зоне покупки", labelEn: "Buy zone alerts" },
                { key: "weeklyDigest" as const, labelRu: "Еженедельный дайджест портфеля", labelEn: "Weekly portfolio digest" },
              ]).map(({ key, labelRu, labelEn }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ color: "#666678", fontSize: 12, fontFamily: "monospace" }}>
                    {lang === "ru" ? labelRu : labelEn}
                  </span>
                  <div
                    onClick={() => savePrefs({ ...prefs, [key]: !prefs[key] })}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: "pointer", flexShrink: 0,
                      background: prefs[key] ? "linear-gradient(135deg,#c9a84c,#8b6810)" : "var(--border2)",
                      border: `1px solid ${prefs[key] ? "#c9a84c40" : "var(--border)"}`,
                      position: "relative", transition: "background 0.2s",
                      opacity: prefsSaving ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 2, left: prefs[key] ? 17 : 2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: prefs[key] ? "var(--bg)" : "#555568",
                      transition: "left 0.2s",
                    }} />
                  </div>
                </label>
              ))}
            </div>
            <div style={{ color: "#333344", fontSize: 9, fontFamily: "monospace", marginTop: 8 }}>
              {lang === "ru"
                ? "Email: " + (user.email ?? "") + " · Отправка будет добавлена в финальной версии"
                : "Email: " + (user.email ?? "") + " · Sending coming in final version"}
            </div>
          </div>
        )}

        {/* API Keys — shown only when Supabase auth is active */}
        {isSupabaseEnabled && user && (
          <div style={{ borderTop: "1px solid var(--border2)", paddingTop: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#444458", letterSpacing: "0.1em" }}>
                🔑 {lang === "ru" ? "API КЛЮЧИ" : "API KEYS"}
              </div>
              <button
                onClick={() => { setShowKeyForm(v => !v); setNewKeyName(""); }}
                style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
              >
                + {lang === "ru" ? "Создать" : "Create"}
              </button>
            </div>

            {/* New key shown once */}
            {newRawKey && (
              <div style={{ background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.3)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ color: "#00d084", fontSize: 9, fontFamily: "monospace", marginBottom: 6 }}>
                  {lang === "ru" ? "⚠ СКОПИРУЙТЕ — БОЛЬШЕ НЕ ПОКАЖЕМ" : "⚠ COPY NOW — SHOWN ONLY ONCE"}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <code style={{ flex: 1, background: "var(--border2)", borderRadius: 5, padding: "6px 10px", fontSize: 11, color: "#00d084", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {newRawKey}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(newRawKey);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ background: copied ? "rgba(0,208,132,0.15)" : "var(--border2)", border: "1px solid rgba(0,208,132,0.3)", color: "#00d084", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    {copied ? (lang === "ru" ? "✓ Скоп." : "✓ Copied") : (lang === "ru" ? "Копировать" : "Copy")}
                  </button>
                </div>
                <button
                  onClick={clearNewKey}
                  style={{ background: "none", border: "none", color: "#444456", fontSize: 9, fontFamily: "monospace", cursor: "pointer", marginTop: 8, padding: 0 }}
                >
                  {lang === "ru" ? "Скрыть" : "Dismiss"}
                </button>
              </div>
            )}

            {/* Create form */}
            {showKeyForm && !newRawKey && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder={lang === "ru" ? "Название ключа (напр. Telegram Bot)" : "Key name (e.g. My Bot)"}
                  style={{ flex: 1, background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 12px", color: "var(--text)", fontSize: 12, fontFamily: "monospace", outline: "none" }}
                  onKeyDown={e => { if (e.key === "Enter" && newKeyName.trim()) { createKey(newKeyName.trim()); setShowKeyForm(false); setNewKeyName(""); } }}
                />
                <button
                  disabled={!newKeyName.trim() || keysLoading}
                  onClick={() => { if (newKeyName.trim()) { createKey(newKeyName.trim()); setShowKeyForm(false); setNewKeyName(""); } }}
                  style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 7, padding: "7px 14px", color: "var(--bg)", fontSize: 12, fontFamily: "monospace", cursor: "pointer", opacity: !newKeyName.trim() || keysLoading ? 0.5 : 1 }}
                >
                  {lang === "ru" ? "Создать" : "Create"}
                </button>
              </div>
            )}

            {keysError && (
              <div style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{keysError}</div>
            )}

            {/* Keys list */}
            {keysLoading && apiKeys.length === 0 ? (
              <div style={{ color: "#444456", fontSize: 10, fontFamily: "monospace" }}>{lang === "ru" ? "Загрузка..." : "Loading..."}</div>
            ) : apiKeys.length === 0 ? (
              <div style={{ color: "#333344", fontSize: 10, fontFamily: "monospace" }}>
                {lang === "ru" ? "Ключей нет. Создайте первый." : "No keys yet. Create one."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {apiKeys.map(k => (
                  <div key={k.id} style={{ background: "var(--border2)", border: `1px solid ${k.revoked ? "rgba(255,77,77,0.15)" : "var(--border)"}`, borderRadius: 8, padding: "10px 12px", opacity: k.revoked ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--text2)", fontSize: 12, fontFamily: "monospace", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {k.name}
                        </div>
                        <div style={{ color: "#555568", fontSize: 10, fontFamily: "monospace" }}>
                          <span style={{ color: "#666678" }}>{k.key_prefix}••••</span>
                          {" · "}
                          <span style={{ color: k.used_this_month >= k.monthly_limit ? "#ff4d4d" : "#444456" }}>
                            {k.used_this_month}/{k.monthly_limit} {lang === "ru" ? "запр/мес" : "req/mo"}
                          </span>
                          {k.revoked && <span style={{ color: "#ff4d4d", marginLeft: 6 }}>{lang === "ru" ? "· отозван" : "· revoked"}</span>}
                        </div>
                      </div>
                      {!k.revoked && (
                        <button
                          onClick={() => revokeKey(k.id)}
                          style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", color: "#ff4d4d88", borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 9, fontFamily: "monospace", flexShrink: 0 }}
                        >
                          {lang === "ru" ? "Отозвать" : "Revoke"}
                        </button>
                      )}
                    </div>
                    <div style={{ color: "#333344", fontSize: 9, fontFamily: "monospace", marginTop: 4 }}>
                      {lang === "ru" ? "создан" : "created"} {new Date(k.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                      {k.last_used_at && ` · ${lang === "ru" ? "исп." : "used"} ${new Date(k.last_used_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ color: "#333344", fontSize: 9, fontFamily: "monospace", marginTop: 8 }}>
              {lang === "ru"
                ? "POST /api/v1/analyze · X-API-Key: aisk_… · Документация в разработке"
                : "POST /api/v1/analyze · X-API-Key: aisk_… · Docs coming soon"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { onSave(p, cur); onClose(); }}
            style={{ flex: 1, background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 9, padding: "11px", color: "var(--bg)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}
          >
            {t("sfSave")}
          </button>
          <button
            onClick={onClose}
            style={{ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "11px 18px", color: "#55556a", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}
          >
            {t("sfClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
