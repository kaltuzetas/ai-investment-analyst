import { useState, useCallback } from "react";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { HistoryEntry } from "@/hooks/useHistory";
import { useBacktest, BacktestOutcome } from "@/hooks/useBacktest";
import { ACTC } from "@/constants/colors";
import { n, fmt } from "@/utils/format";
import { Tag } from "@/components/atoms";

interface Props {
  lang: Lang;
  history: HistoryEntry[];
  onAnalyze: (ticker: string) => void;
  userId?: string;
}

const ACTION_EMOJI: Record<string, string> = { buy: "🟢", hold: "🟡", sell: "🔴", watch: "🔵" };
const OUTCOME_COLOR: Record<string, string> = { correct: "#00d084", incorrect: "#ff4d4d", partial: "#f5a623" };

function suggestOutcome(action: string, changePct: number): BacktestOutcome["outcome"] {
  const a = n(action);
  if (a === "buy")  return changePct >= 5 ? "correct" : changePct <= -5 ? "incorrect" : "partial";
  if (a === "sell") return changePct <= -5 ? "correct" : changePct >= 5 ? "incorrect" : "partial";
  // hold / watch — within ±10% is partial, otherwise incorrect if large divergence
  return Math.abs(changePct) <= 10 ? "partial" : changePct < -15 ? "incorrect" : "partial";
}

function AutoBacktestCheck({ entry, lang, onSuggest }: { entry: HistoryEntry; lang: Lang; onSuggest: (o: BacktestOutcome["outcome"]) => void }) {
  const ru = lang !== "en";
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [curPrice, setCurPrice] = useState<number | null>(null);

  const check = useCallback(async () => {
    if (!entry.entryPrice || !entry.ticker) return;
    setState("loading");
    try {
      const res = await fetch(`/api/price/${encodeURIComponent(entry.ticker.toUpperCase())}`);
      const json = await res.json();
      if (json.error || !json.price) throw new Error("no price");
      setCurPrice(json.price as number);
      setState("done");
    } catch {
      setState("error");
    }
  }, [entry.ticker, entry.entryPrice]);

  if (!entry.entryPrice) return null;

  const changePct = curPrice != null ? (curPrice - entry.entryPrice) / entry.entryPrice * 100 : null;
  const suggested = changePct != null ? suggestOutcome(entry.action, changePct) : null;
  const OUTCOME_COLOR_MAP = { correct: "#00d084", incorrect: "#ff4d4d", partial: "#f5a623" };

  return (
    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ color: "#333348", fontSize: 10, fontFamily: "monospace" }}>
        {ru ? "Вход" : "Entry"}: ${fmt(entry.entryPrice)}
      </span>
      {state === "idle" && (
        <button onClick={check} style={{ background: "rgba(139,156,247,0.08)", border: "1px solid rgba(139,156,247,0.2)", borderRadius: 5, padding: "2px 8px", color: "#8b9cf7", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>
          ⚡ {ru ? "Авто-проверить" : "Auto-check"}
        </button>
      )}
      {state === "loading" && <span style={{ color: "#555568", fontSize: 10, fontFamily: "monospace" }}>...</span>}
      {state === "error" && <span style={{ color: "#ff4d4d", fontSize: 10, fontFamily: "monospace" }}>{ru ? "нет данных" : "no data"}</span>}
      {state === "done" && curPrice != null && changePct != null && suggested && (
        <>
          <span style={{ color: changePct >= 0 ? "#00d084" : "#ff4d4d", fontSize: 10, fontFamily: "monospace" }}>
            ${fmt(curPrice)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%)
          </span>
          <button
            onClick={() => onSuggest(suggested)}
            style={{ background: `${OUTCOME_COLOR_MAP[suggested]}15`, border: `1px solid ${OUTCOME_COLOR_MAP[suggested]}40`, borderRadius: 5, padding: "2px 8px", color: OUTCOME_COLOR_MAP[suggested], fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}
          >
            ✓ {ru ? { correct: "Верно", incorrect: "Неверно", partial: "Частично" }[suggested] : { correct: "Correct", incorrect: "Incorrect", partial: "Partial" }[suggested]}?
          </button>
        </>
      )}
    </div>
  );
}

function OutcomeEditor({ entry, outcome, lang, onSave }: { entry: HistoryEntry; outcome?: BacktestOutcome; lang: Lang; onSave: (o: BacktestOutcome["outcome"], note: string) => void }) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<BacktestOutcome["outcome"] | null>(outcome?.outcome ?? null);
  const [note, setNote] = useState(outcome?.note ?? "");

  if (!open && outcome) return (
    <div onClick={() => setOpen(true)} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
      <span style={{ color: OUTCOME_COLOR[outcome.outcome], fontSize: 11, fontFamily: "monospace" }}>
        {t({ correct: "btCorrect", incorrect: "btWrong", partial: "btPartial" }[outcome.outcome])}
      </span>
      {outcome.note && <span style={{ color: "#444456", fontSize: 10 }}>— {outcome.note}</span>}
    </div>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 5, padding: "3px 8px", color: "var(--text3)", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
      {t("btMark")}
    </button>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {(["correct", "incorrect", "partial"] as const).map(o => (
          <button key={o} onClick={() => setSel(o)} style={{ background: sel === o ? `${OUTCOME_COLOR[o]}20` : "var(--border2)", border: `1px solid ${sel === o ? OUTCOME_COLOR[o] + "60" : "var(--border2)"}`, color: sel === o ? OUTCOME_COLOR[o] : "#444456", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
            {t({ correct: "btCorrect", incorrect: "btWrong", partial: "btPartial" }[o])}
          </button>
        ))}
      </div>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder={t("btNote")} style={{ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 5, padding: "5px 10px", color: "var(--text)", fontSize: 11, fontFamily: "monospace", width: "100%", marginBottom: 6, outline: "none" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => { if (sel) { onSave(sel, note); setOpen(false); } }} disabled={!sel} style={{ background: "var(--border)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", borderRadius: 5, padding: "4px 12px", cursor: sel ? "pointer" : "not-allowed", fontSize: 10, fontFamily: "monospace" }}>{t("btSave")}</button>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 5, padding: "4px 10px", color: "var(--text3)", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>{t("sfClose")}</button>
      </div>
    </div>
  );
}

export function BacktestView({ lang, history, onAnalyze, userId }: Props) {
  const ru = lang !== "en";
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const { saveOutcome, getOutcome } = useBacktest(userId);
  const [filter, setFilter] = useState<"all" | "30d" | "unmarked">("all");

  const now = Date.now();
  const DAY_MS = 86_400_000;

  if (history.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: .3 }}>📅</div>
      <div style={{ color: "var(--text3)", fontSize: 15 }}>{t("btEmpty")}</div>
      <div style={{ color: "var(--text3)", fontSize: 13, marginTop: 6 }}>{t("btEmptySub")}</div>
    </div>
  );

  const filteredHistory = history.filter(h => {
    if (filter === "30d") return (now - h.searchedAt) <= 30 * DAY_MS;
    if (filter === "unmarked") return !getOutcome(h.id);
    return true;
  });

  // Group by ticker
  const grouped: Record<string, HistoryEntry[]> = {};
  filteredHistory.forEach(h => {
    const k = h.ticker ?? h.query;
    (grouped[k] ??= []).push(h);
  });

  const stats = { correct: 0, incorrect: 0, partial: 0 };
  history.forEach(h => {
    const o = getOutcome(h.id);
    if (o) stats[o.outcome]++;
  });
  const marked = stats.correct + stats.incorrect + stats.partial;
  const accuracy = marked > 0 ? Math.round(stats.correct / marked * 100) : null;
  const pendingVerify = history.filter(h => !getOutcome(h.id) && (now - h.searchedAt) > 7 * DAY_MS).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.2em", fontFamily: "monospace" }}>{t("btTitle")}</div>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "30d", "unmarked"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "var(--border)" : "var(--border2)", border: `1px solid ${filter === f ? "rgba(201,168,76,0.4)" : "var(--border2)"}`, color: filter === f ? "#c9a84c" : "#555568", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
              {f === "all" ? (ru ? "Все" : "All") : f === "30d" ? "30д" : (ru ? "Без оценки" : "Unrated")}
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy banner */}
      {marked > 0 && (
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: accuracy! >= 60 ? "#00d084" : accuracy! >= 40 ? "#f5a623" : "#ff4d4d", fontSize: 28, fontWeight: 900, fontFamily: "monospace" }}>{accuracy}%</div>
              <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{ru ? "точность" : "accuracy"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {ru
                  ? `${stats.correct} из ${marked} прогнозов сбылись`
                  : `${stats.correct} of ${marked} forecasts were correct`}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["correct", "incorrect", "partial"] as const).map(k => stats[k] > 0 && (
                  <span key={k} style={{ color: OUTCOME_COLOR[k], fontSize: 11, fontFamily: "monospace" }}>
                    {stats[k]} {t({ correct: "btCorrect", incorrect: "btWrong", partial: "btPartial" }[k]).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
            {pendingVerify > 0 && (
              <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                <div style={{ color: "#f5a623", fontSize: 14, fontWeight: 700 }}>{pendingVerify}</div>
                <div style={{ color: "#f5a62388", fontSize: 9, fontFamily: "monospace" }}>{ru ? "ждут оценки" : "pending"}</div>
              </div>
            )}
          </div>
          {/* Accuracy bar */}
          <div style={{ marginTop: 10, background: "var(--border2)", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, #00d084 ${(stats.correct / marked) * 100}%, #f5a623 ${((stats.correct + stats.partial) / marked) * 100}%, #ff4d4d 100%)`, width: "100%" }} />
          </div>
        </div>
      )}

      {/* Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Object.entries(grouped).map(([ticker, items]) => {
          const aC = ACTC[n(items[0].action) as keyof typeof ACTC] ?? ACTC.watch;
          return (
            <div key={ticker} style={{ background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border2)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "var(--text)", fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>{ticker}</span>
                  <Tag color={aC.c}>{items[0].action?.toUpperCase()}</Tag>
                  <span style={{ color: "var(--text3)", fontSize: 10 }}>{items.length} {lang === "ru" ? "запр." : "queries"}</span>
                </div>
                <button onClick={() => onAnalyze(ticker)} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", color: "#c9a84c", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>↺</button>
              </div>
              <div>
                {items.map((h, i) => {
                  const outcome = getOutcome(h.id);
                  const aC2 = ACTC[n(h.action) as keyof typeof ACTC] ?? ACTC.watch;
                  return (
                    <div key={h.id} style={{ padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--border2)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span>{ACTION_EMOJI[n(h.action)] ?? "🔵"}</span>
                          <span style={{ color: aC2.c, fontSize: 11, fontFamily: "monospace" }}>{h.action?.toUpperCase()}</span>
                          <span style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>
                            {new Date(h.searchedAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                          </span>
                        </div>
                        <OutcomeEditor entry={h} outcome={outcome} lang={lang} onSave={(o, note) => saveOutcome(h.id, o, note)} />
                      </div>
                      {!outcome && (now - h.searchedAt) > 7 * DAY_MS && (
                        <AutoBacktestCheck
                          entry={h}
                          lang={lang}
                          onSuggest={(o) => saveOutcome(h.id, o, "auto")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
