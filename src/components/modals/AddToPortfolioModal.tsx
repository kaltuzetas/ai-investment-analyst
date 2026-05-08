import { useState } from "react";
import { Lang } from "@/types";
import { TR } from "@/constants/translations";
import { fmt } from "@/utils/format";

interface ModalData {
  ticker: string;
  name: string;
  currentPrice: number | null;
  currency: string;
}

interface Props {
  modal: ModalData;
  lang: Lang;
  onConfirm: (qty: number | null, price: number | null) => void;
  onClose: () => void;
}

export function AddToPortfolioModal({ modal, lang, onConfirm, onClose }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const handleConfirm = () => {
    // [FIX] `parseFloat(x) || null` maps "0" → 0 → falsy → null (wrong).
    // Use explicit empty-string guard so that qty/price of 0 are preserved.
    const qtyVal   = qty.trim()   !== "" ? parseFloat(qty)   : null;
    const priceVal = price.trim() !== "" ? parseFloat(price) : null;
    onConfirm(
      qtyVal   !== null && isFinite(qtyVal)   ? qtyVal   : null,
      priceVal !== null && isFinite(priceVal) ? priceVal : null,
    );
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420 }}>
        <div style={{ color: "#c9a84c", fontSize: 11, letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: 4 }}>{t("mTitle")}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{modal.ticker}</div>
        <div style={{ fontSize: 13, color: "#55556a", marginBottom: 20 }}>{modal.name}</div>

        {modal.currentPrice != null && (
          <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#666678", fontSize: 12 }}>{t("nowLbl")}</span>
            <span style={{ color: "#c9a84c", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>
              {modal.currency}{fmt(modal.currentPrice)}
            </span>
          </div>
        )}

        {[
          { key: "qty", label: t("mQL"), hint: t("mQH"), placeholder: t("mQP"), value: qty, onChange: setQty },
          { key: "price", label: t("mPL"), hint: t("mPH"), placeholder: `${t("mPP")} ${modal.currentPrice || "0.00"}`, value: price, onChange: setPrice },
        ].map(({ key, label, hint, placeholder, value, onChange }) => (
          <div key={key} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ color: "#ccccdd", fontSize: 13, fontWeight: 600 }}>{label}</div>
              <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace" }}>{t("mOpt")}</div>
            </div>
            <div style={{ color: "#444456", fontSize: 11, marginBottom: 8 }}>{hint}</div>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              type="number"
              style={{ width: "100%", background: "var(--border2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, fontFamily: "monospace", outline: "none" }}
            />
          </div>
        ))}

        <div style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", marginBottom: 20, textAlign: "center" }}>{t("mSkip")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleConfirm} style={{ flex: 1, background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 8, padding: 12, color: "var(--bg)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}>
            {t("mAdd")}
          </button>
          <button onClick={onClose} style={{ background: "var(--border2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 18px", color: "#55556a", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>
            {t("mCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
