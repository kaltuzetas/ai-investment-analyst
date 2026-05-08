import { useState } from "react";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { useTradeJournal, JournalEntry } from "@/hooks/useTradeJournal";

interface Props {
  lang: Lang;
  filterTicker?: string; // if set, show only this ticker
  userId?: string;
}

const TYPE_COLOR = { buy: "#00d084", sell: "#ff4d4d", note: "#8b9cf7" };
const TYPE_ICON  = { buy: "↑", sell: "↓", note: "📝" };

function AddForm({ lang, filterTicker, onAdd }: { lang: Lang; filterTicker?: string; onAdd: (e: Omit<JournalEntry, "id" | "createdAt">) => void }) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const today = new Date().toISOString().slice(0, 10);
  const [ticker, setTicker] = useState(filterTicker ?? "");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<"buy" | "sell" | "note">("buy");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const inp = (style?: object) => ({ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 12, fontFamily: "monospace", width: "100%", ...style });

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", color: "#c9a84c", borderRadius: 7, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontFamily: "monospace", marginBottom: 16 }}>
      {t("jrAdd")}
    </button>
  );

  const handleSave = () => {
    if (!ticker.trim()) return;
    // [FIX] Use !== "" check instead of truthiness so that price/qty of 0 are preserved.
    // `price ? +price : undefined` maps "0" → 0 → falsy → undefined (wrong).
    onAdd({ ticker: ticker.trim().toUpperCase(), date, type, price: price !== "" ? +price : undefined, qty: qty !== "" ? +qty : undefined, note, currency: "$" });
    setNote(""); setPrice(""); setQty(""); setOpen(false);
  };

  return (
    <div style={{ background: "var(--border2)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {!filterTicker && (
          <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="AAPL" style={{ ...inp(), gridColumn: "1/-1" }} />
        )}
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp()} />
        <div style={{ display: "flex", gap: 6 }}>
          {(["buy", "sell", "note"] as const).map(tp => (
            <button key={tp} onClick={() => setType(tp)} style={{ flex: 1, background: type === tp ? `${TYPE_COLOR[tp]}20` : "var(--border2)", border: `1px solid ${type === tp ? TYPE_COLOR[tp] + "50" : "var(--border2)"}`, color: type === tp ? TYPE_COLOR[tp] : "#444456", borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
              {TYPE_ICON[tp]} {t({ buy: "jrBuy", sell: "jrSell", note: "jrNote" }[tp])}
            </button>
          ))}
        </div>
        {type !== "note" && (
          <>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder={t("jrPrice2")} style={inp()} type="number" />
            <input value={qty} onChange={e => setQty(e.target.value)} placeholder={t("jrQty")} style={inp()} type="number" />
          </>
        )}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t("jrNote")} rows={2} style={{ ...inp(), gridColumn: "1/-1", resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 7, padding: "7px 18px", color: "var(--bg)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}>{t("jrSaveBtn")}</button>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 7, padding: "7px 14px", color: "var(--text3)", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>{t("sfClose")}</button>
      </div>
    </div>
  );
}

export function TradeJournalSection({ lang, filterTicker, userId }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const { entries, add, remove, byTicker } = useTradeJournal(userId);
  const list = filterTicker ? byTicker(filterTicker) : entries;

  return (
    <div>
      <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace", marginBottom: 14 }}>{t("jrTitle")}</div>
      <AddForm lang={lang} filterTicker={filterTicker} onAdd={add} />
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text3)", fontSize: 13 }}>{t("jrEmpty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map(e => (
            <div key={e.id} style={{ background: "var(--border2)", border: `1px solid ${TYPE_COLOR[e.type]}20`, borderLeft: `2px solid ${TYPE_COLOR[e.type]}`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ color: TYPE_COLOR[e.type], fontSize: 14, flexShrink: 0, marginTop: 1 }}>{TYPE_ICON[e.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ color: "var(--text)", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{e.ticker}</span>
                  <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{e.date}</span>
                  {e.type !== "note" && e.price != null && (
                    <span style={{ color: "#666678", fontSize: 10, fontFamily: "monospace" }}>${e.price}{e.qty ? ` × ${e.qty}` : ""}</span>
                  )}
                </div>
                {e.note && <div style={{ color: "#666678", fontSize: 12, lineHeight: 1.5 }}>{e.note}</div>}
              </div>
              <button onClick={() => remove(e.id)} style={{ background: "none", border: "none", color: "#ff4d4d33", cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
