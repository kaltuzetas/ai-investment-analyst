import { Lang } from "@/types";
import { classifyError, ERROR_LABELS } from "@/utils/errors";

interface Props {
  error: string;
  lang: Lang;
  onRetry: () => void;
}

const ICONS: Record<string, string> = {
  network:    "📡",
  timeout:    "⏱",
  rate_limit: "🚦",
  overloaded: "🔥",
  server:     "🔧",
  not_found:  "🔍",
  parse:      "⚙️",
  unknown:    "⚠️",
};

export function ErrorBlock({ error, lang, onRetry }: Props) {
  const classified = classifyError(error);
  const labels = ERROR_LABELS[classified.kind][lang];
  const icon = ICONS[classified.kind] ?? "⚠️";
  const retryLabel = lang === "ru" ? "↩ Попробовать ещё раз" : "↩ Try again";

  return (
    <div style={{ background: "rgba(255,77,77,0.07)", border: "1px solid rgba(255,77,77,0.25)", borderRadius: 12, padding: "20px 22px", marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#ff7070", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {labels.title}
          </div>
          <div style={{ color: "#886678", fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
            {labels.hint}
          </div>
          {classified.retryable && (
            <button
              onClick={onRetry}
              style={{ background: "rgba(255,77,77,0.15)", border: "1px solid rgba(255,77,77,0.3)", color: "#ff7070", borderRadius: 7, padding: "7px 18px", cursor: "pointer", fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
