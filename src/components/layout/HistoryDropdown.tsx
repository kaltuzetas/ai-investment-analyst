import { useState, useRef, useCallback } from "react";
import { Lang } from "@/types";
import { HistoryEntry } from "@/hooks/useHistory";
import { ACTC } from "@/constants/colors";
import { n } from "@/utils/format";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  history: HistoryEntry[];
  lang: Lang;
  onSelect: (query: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void | Promise<void>;
}

const ACTION_EMOJI: Record<string, string> = {
  buy: "🟢", hold: "🟡", sell: "🔴", watch: "🔵",
};

export function HistoryDropdown({ history, lang, onSelect, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const label = lang === "ru" ? "История" : "History";
  const emptyLabel = lang === "ru" ? "История пуста" : "No history yet";
  const clearLabel = lang === "ru" ? "Очистить" : "Clear all";

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (lang === "ru") {
      if (mins < 1) return "только что";
      if (mins < 60) return `${mins} мин.`;
      if (hours < 24) return `${hours} ч.`;
      return `${days} д.`;
    } else {
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m`;
      if (hours < 24) return `${hours}h`;
      return `${days}d`;
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ background: open ? "rgba(201,168,76,0.12)" : "var(--border2)", border: "1px solid var(--border)", color: "#c9a84c88", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}
      >
        🕐 {label} {history.length > 0 && <span style={{ background: "var(--border)", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{history.length}</span>}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 300, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {history.length === 0 ? (
            <div style={{ padding: "20px 16px", color: "var(--text3)", fontSize: 12, fontFamily: "monospace", textAlign: "center" }}>{emptyLabel}</div>
          ) : (
            <>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {history.map((h) => {
                  const aC = ACTC[n(h.action) as keyof typeof ACTC] ?? ACTC.watch;
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--border2)", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontSize: 16 }}>{ACTION_EMOJI[n(h.action)] ?? "🔵"}</div>
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => { onSelect(h.query); setOpen(false); }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: "var(--text)", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{h.ticker}</span>
                          <span style={{ color: aC.c, fontSize: 9, fontFamily: "monospace", background: `${aC.c}15`, border: `1px solid ${aC.c}30`, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" }}>{h.action}</span>
                          {h.lang !== "ru" && <span style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>EN</span>}
                        </div>
                        <div style={{ color: "#555568", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{formatTime(h.searchedAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemove(h.id); }}
                          style={{ background: "none", border: "none", color: "#ff4d4d44", cursor: "pointer", fontSize: 12, padding: "0 2px", lineHeight: 1 }}
                        >✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border2)", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { onClear(); setOpen(false); }}
                  style={{ background: "none", border: "none", color: "#ff4d4d66", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}
                >{clearLabel}</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
