import { useState } from "react";
import { Lang } from "@/types";

const LS_KEY = "ais_cookie_ok";

function isAccepted() {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}
function setAccepted() {
  try { localStorage.setItem(LS_KEY, "1"); } catch {}
}

interface Props {
  lang: Lang;
  onOpenPrivacy: () => void;
}

export function CookieBanner({ lang, onOpenPrivacy }: Props) {
  const [dismissed, setDismissed] = useState(() => isAccepted());
  const ru = lang !== "en";

  if (dismissed) return null;

  const accept = () => { setAccepted(); setDismissed(true); };

  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 560,
      background: "var(--bg2)", border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: 12, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 14,
      zIndex: 1500, boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 200, color: "#777788", fontSize: 11, lineHeight: 1.6, fontFamily: "monospace" }}>
        {ru
          ? <>🍪 Сервис использует localStorage для хранения настроек и кэша. Персональные данные в cookie не хранятся. <span onClick={onOpenPrivacy} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Подробнее</span></>
          : <>🍪 This service uses localStorage for settings and cache. No personal data is stored in cookies. <span onClick={onOpenPrivacy} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Learn more</span></>}
      </div>
      <button
        onClick={accept}
        style={{
          background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none",
          borderRadius: 8, padding: "8px 18px", color: "var(--bg)",
          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        {ru ? "Понятно" : "Got it"}
      </button>
    </div>
  );
}
