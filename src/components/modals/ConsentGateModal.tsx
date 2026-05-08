import { useState } from "react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
  onAccept: () => void;
  onOpenTos: () => void;
  onOpenPrivacy: () => void;
  loading?: boolean;
}

export function ConsentGateModal({ lang, onAccept, onOpenTos, onOpenPrivacy, loading }: Props) {
  const ru = lang !== "en";
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [c4, setC4] = useState(false);
  const [c5, setC5] = useState(false);

  const allChecked = c1 && c2 && c3 && c4 && c5;

  const Check = ({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) => (
    <label
      onClick={onChange}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: "10px 14px", borderRadius: 8, background: checked ? "rgba(201,168,76,0.06)" : "var(--border2)", border: `1px solid ${checked ? "rgba(201,168,76,0.3)" : "var(--border)"}`, transition: "all 0.15s", marginBottom: 8 }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#c9a84c" : "#444456"}`, background: checked ? "#c9a84c" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
        {checked && <span style={{ color: "#111", fontSize: 11, fontWeight: 900 }}>✓</span>}
      </div>
      <span style={{ color: checked ? "var(--text)" : "var(--text2)", fontSize: 12, lineHeight: 1.55 }}>{children}</span>
    </label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#c9a84c", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 6 }}>
            ⚖ {ru ? "УСЛОВИЯ ИСПОЛЬЗОВАНИЯ" : "TERMS OF USE"}
          </div>
          <div style={{ color: "var(--text)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            {ru ? "Прежде чем начать" : "Before you start"}
          </div>
          <div style={{ color: "#666678", fontSize: 12, lineHeight: 1.6 }}>
            {ru
              ? "Сервис предоставляет аналитическую информацию об активах. Пожалуйста, подтвердите что понимаете условия работы."
              : "This service provides analytical information about assets. Please confirm you understand the terms."}
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: 20 }}>
          <Check checked={c1} onChange={() => setC1(v => !v)}>
            {ru ? (
              <>Я ознакомился с{" "}
                <span onClick={e => { e.stopPropagation(); onOpenTos(); }} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Пользовательским соглашением</span>
                {" "}и{" "}
                <span onClick={e => { e.stopPropagation(); onOpenPrivacy(); }} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Политикой конфиденциальности</span>
              </>
            ) : (
              <>I have read the{" "}
                <span onClick={e => { e.stopPropagation(); onOpenTos(); }} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span>
                {" "}and{" "}
                <span onClick={e => { e.stopPropagation(); onOpenPrivacy(); }} style={{ color: "#c9a84c", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
              </>
            )}
          </Check>

          <Check checked={c2} onChange={() => setC2(v => !v)}>
            {ru
              ? "Понимаю, что сервис предоставляет аналитическую информацию, а НЕ является индивидуальной инвестиционной рекомендацией в смысле ст. 6.1 Федерального закона от 22.04.1996 №39-ФЗ «О рынке ценных бумаг»"
              : "I understand this service provides analytical information and is NOT individual investment advice. All analyses are informational only."}
          </Check>

          <Check checked={c3} onChange={() => setC3(v => !v)}>
            {ru
              ? "Принимаю инвестиционные решения самостоятельно, осознаю риски и несу за них полную ответственность"
              : "I make investment decisions independently, understand the risks, and bear full responsibility for them"}
          </Check>

          <Check checked={c4} onChange={() => setC4(v => !v)}>
            {ru ? "Мне исполнилось 18 лет" : "I confirm I am 18 years of age or older"}
          </Check>

          <Check checked={c5} onChange={() => setC5(v => !v)}>
            {ru
              ? "Даю согласие на передачу моих персональных данных за рубеж (США — Supabase Inc., Anthropic Inc.; иные страны — согласно Политике конфиденциальности) в целях оказания сервиса, в соответствии с ч. 4 ст. 12 Федерального закона от 27.07.2006 №152-ФЗ «О персональных данных»"
              : "I consent to the transfer of my personal data to third countries (USA — Supabase Inc., Anthropic Inc.; other countries per Privacy Policy) for the purpose of providing the service"}
          </Check>
        </div>

        {/* Legal note */}
        <div style={{ background: "rgba(255,165,0,0.05)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
          <div style={{ color: "#888870", fontSize: 10, fontFamily: "monospace", lineHeight: 1.6 }}>
            {ru
              ? "⚠ Инвестиции в финансовые инструменты связаны с риском потери вложенного капитала. Прошлые аналитические паттерны не гарантируют аналогичных результатов в будущем."
              : "⚠ Investing in financial instruments involves risk of loss. Past analytical patterns do not guarantee future results."}
          </div>
        </div>

        {/* Button */}
        <button
          disabled={!allChecked || loading}
          onClick={onAccept}
          style={{
            width: "100%",
            background: allChecked && !loading ? "linear-gradient(135deg,#c9a84c,#8b6810)" : "var(--border2)",
            border: "none", borderRadius: 10, padding: "13px",
            color: allChecked && !loading ? "var(--bg)" : "#444456",
            fontSize: 14, fontWeight: 700, cursor: allChecked && !loading ? "pointer" : "not-allowed",
            fontFamily: "monospace", transition: "all 0.2s",
          }}
        >
          {loading
            ? (ru ? "Сохранение..." : "Saving...")
            : allChecked
              ? (ru ? "✓ Подтверждаю и начинаю →" : "✓ I confirm and continue →")
              : (ru ? "Отметьте все пункты выше" : "Check all items above")}
        </button>

        <div style={{ color: "#333344", fontSize: 9, fontFamily: "monospace", marginTop: 10, textAlign: "center" }}>
          {ru
            ? "Дата и время принятия фиксируются. Версия условий: v1.1"
            : "Acceptance timestamp is recorded. Terms version: v1.1"}
        </div>
      </div>
    </div>
  );
}
