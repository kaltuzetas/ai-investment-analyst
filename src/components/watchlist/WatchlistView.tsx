import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { ACTC } from "@/constants/colors";
import { n } from "@/utils/format";
import { WatchlistEntry } from "@/hooks/useWatchlist";

interface Props {
  lang: Lang;
  onGoAnalyze: () => void;
  onSelectTicker: (ticker: string) => void;
  watchlist: WatchlistEntry[];
  onRemove: (id: string) => void;
}

const ACTION_EMOJI: Record<string, string> = {
  buy: "🟢", hold: "🟡", sell: "🔴", watch: "🔵",
};

export function WatchlistView({ lang, onGoAnalyze, onSelectTicker, watchlist, onRemove }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" });
  };

  if (watchlist.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "70px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: .3 }}>👁</div>
        <div style={{ color: "var(--text3)", fontSize: 15, fontStyle: "italic", marginBottom: 12 }}>{t("wlEmpty")}</div>
        <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16 }}>{t("wlEmptySub")}</div>
        <button
          onClick={onGoAnalyze}
          style={{ background: "var(--border)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}
        >
          {t("goAnalyze")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ color: "#f5a623", fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ</span>
        <span style={{ color: "#666655", fontSize: 11, lineHeight: 1.5 }}>{t("alDisclaimer")}</span>
      </div>
      <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 16 }}>
        {lang === "ru" ? `${watchlist.length} актив${watchlist.length === 1 ? "" : watchlist.length < 5 ? "а" : "ов"} в списке наблюдения` : `${watchlist.length} asset${watchlist.length === 1 ? "" : "s"} in watchlist`}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {watchlist.map((item) => {
          const aC = ACTC[n(item.action) as keyof typeof ACTC] ?? ACTC.watch;
          return (
            <div
              key={item.id}
              style={{ background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease both" }}
            >
              <div style={{ fontSize: 18, flexShrink: 0 }}>{ACTION_EMOJI[n(item.action)] ?? "🔵"}</div>
              <div
                style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                onClick={() => onSelectTicker(item.ticker)}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--text)", fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>{item.ticker}</span>
                  <span style={{ color: aC.c, fontSize: 9, background: `${aC.c}15`, border: `1px solid ${aC.c}30`, borderRadius: 4, padding: "1px 5px", fontFamily: "monospace", textTransform: "uppercase" }}>{item.action}</span>
                  {item.assetClass && <span style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{item.assetClass}</span>}
                </div>
                <div style={{ color: "#444456", fontSize: 12, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{t("wlAddedLbl")} {formatDate(item.addedAt)}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => onSelectTicker(item.ticker)}
                    style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", color: "#c9a84c", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
                  >
                    {lang === "ru" ? "→ Анализ" : "→ Analyze"}
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    style={{ background: "none", border: "none", color: "#ff4d4d44", cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}
                  >✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
