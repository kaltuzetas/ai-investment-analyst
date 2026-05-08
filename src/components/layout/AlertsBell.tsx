import { useState, useRef, useCallback } from "react";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { useAlerts, Alert } from "@/hooks/useAlerts";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  lang: Lang;
}

export function AlertsBell({ lang }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const { alerts, triggered, remove, clearTriggered } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: "relative", background: triggered.length > 0 ? "rgba(255,77,77,0.15)" : "var(--border2)", border: `1px solid ${triggered.length > 0 ? "rgba(255,77,77,0.4)" : "var(--border2)"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: triggered.length > 0 ? "#ff7070" : "var(--text3)" }}
      >
        🔔
        {alerts.length > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: triggered.length > 0 ? "#ff4d4d" : "#c9a84c", color: "var(--bg)", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", animation: "fadeUp 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#c9a84c", fontSize: 11, fontFamily: "monospace" }}>{t("alTitle")}</span>
            {triggered.length > 0 && (
              <button onClick={clearTriggered} style={{ background: "none", border: "none", color: "#ff4d4d", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>{t("alClear")}</button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", padding: "16px 0" }}>{t("alNoAlerts")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((alert: Alert) => (
                <div key={alert.id} style={{ background: alert.triggeredAt ? "rgba(255,77,77,0.08)" : "var(--border2)", border: `1px solid ${alert.triggeredAt ? "rgba(255,77,77,0.3)" : "var(--border2)"}`, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: "var(--text)", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>{alert.ticker}</span>
                      {alert.triggeredAt && <span style={{ color: "#ff7070", fontSize: 9, fontFamily: "monospace" }}>🔴 {t("alTriggered")}</span>}
                    </div>
                    <div style={{ color: "#444456", fontSize: 10, marginTop: 2 }}>{t("alBuyZone")}</div>
                  </div>
                  <button onClick={() => remove(alert.id)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
