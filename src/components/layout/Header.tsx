import type { User } from "@supabase/supabase-js";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { useTheme, Theme } from "@/contexts/ThemeContext";

export type TabId = "analyze" | "portfolio" | "watchlist" | "screener" | "compare" | "backtest" | "accuracy";

const THEME_LABELS: Record<Theme, string> = { dark: "◑", light: "☀", warm: "🕯" };

interface Props {
  lang: Lang;
  tab: TabId;
  portfolioCount: number;
  watchlistCount: number;
  alertCount: number;
  user?: User | null;
  onLangChange: (lang: Lang) => void;
  onTabChange: (tab: TabId) => void;
  onSettingsOpen: () => void;
  onAccountOpen: () => void;
}

export function Header({ lang, tab, portfolioCount, watchlistCount, alertCount, user, onLangChange, onTabChange, onSettingsOpen, onAccountOpen }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const { theme, setTheme } = useTheme();

  const tabs: { id: TabId; labelKey: string; count?: number }[] = [
    { id: "analyze",   labelKey: "tabAnalyze",   count: 0 },
    { id: "portfolio", labelKey: "tabPortfolio",  count: portfolioCount },
    { id: "watchlist", labelKey: "tabWatchlist",  count: watchlistCount },
    { id: "screener",  labelKey: "tabScreener",   count: 0 },
    { id: "compare",   labelKey: "tabCompare",    count: 0 },
    { id: "backtest",  labelKey: "tabBacktest",   count: 0 },
    { id: "accuracy",  labelKey: "tabAccuracy",   count: 0 },
  ];

  const avatarUrl: string | null = (() => {
    if (!user) return null;
    try {
      const u = user.user_metadata?.avatar_url as string | undefined;
      if (!u) return null;
      const p = new URL(u);
      return (p.protocol === "https:" || p.protocol === "http:") ? p.href : null;
    } catch { return null; }
  })();
  const initials = user
    ? ((user.user_metadata?.full_name as string | undefined)
        ?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
        || user.email?.[0].toUpperCase() || "?")
    : null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ color: "var(--accent)", fontSize: 10, letterSpacing: "0.3em", fontFamily: "monospace", marginBottom: 6 }}>
            {t("sysTitle")}
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", fontWeight: 900, lineHeight: 1.05, background: "linear-gradient(135deg,var(--text) 0%,var(--accent) 50%,var(--accent2) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t("appTitle")}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Lang */}
          <div style={{ display: "flex", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: 3, gap: 3 }}>
            {(["ru", "en"] as Lang[]).map(l => (
              <button key={l} onClick={() => onLangChange(l)} style={{ background: lang === l ? "var(--border)" : "transparent", border: lang === l ? "1px solid var(--border)" : "1px solid transparent", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: lang === l ? "var(--accent)" : "var(--text3)", fontSize: 12, fontFamily: "monospace", fontWeight: lang === l ? 700 : 400, textTransform: "uppercase" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <div style={{ display: "flex", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: 3, gap: 3 }}>
            {(["dark", "light", "warm"] as Theme[]).map(th => (
              <button key={th} onClick={() => setTheme(th)} title={th} style={{ background: theme === th ? "var(--border)" : "transparent", border: theme === th ? "1px solid var(--border)" : "1px solid transparent", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>
                {THEME_LABELS[th]}
              </button>
            ))}
          </div>

          {/* Alerts bell */}
          <button
            onClick={() => onTabChange("watchlist")}
            style={{ position: "relative", background: alertCount > 0 ? "rgba(255,77,77,0.12)" : "var(--bg3)", border: `1px solid ${alertCount > 0 ? "rgba(255,77,77,0.35)" : "var(--border2)"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: alertCount > 0 ? "#ff7070" : "var(--text3)" }}
          >
            🔔
            {alertCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#ff4d4d", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {alertCount}
              </span>
            )}
          </button>

          {/* Account avatar */}
          {user && (
            <button
              onClick={onAccountOpen}
              title={user.email ?? ""}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: 0, cursor: "pointer", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: 34, height: 34, objectFit: "cover" }} />
                : <span style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{initials}</span>
              }
            </button>
          )}

          {/* Settings */}
          <button onClick={onSettingsOpen} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--text3)", fontSize: 14 }}>
            ⚙
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: 4 }}>
        {tabs.map(({ id, labelKey, count }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{ background: tab === id ? "var(--border)" : "transparent", border: tab === id ? "1px solid var(--border)" : "1px solid transparent", borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: tab === id ? "var(--accent)" : "var(--text3)", fontSize: 12, fontFamily: "monospace", fontWeight: tab === id ? 600 : 400, whiteSpace: "nowrap" }}
          >
            {t(labelKey)}{count ? ` (${count})` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
