import { useState, useCallback, useEffect, useRef } from "react";

const KEY_PREFIX = "ais_profile_v1";

export interface InvestorProfile {
  horizon: "short" | "medium" | "long";
  risk: "conservative" | "moderate" | "aggressive";
  goal: "income" | "growth" | "speculation";
}

const DEFAULT: InvestorProfile = { horizon: "medium", risk: "moderate", goal: "growth" };

function storageKey(userId?: string) {
  return userId ? `${KEY_PREFIX}:${userId}` : KEY_PREFIX;
}

function load(userId?: string): InvestorProfile {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function profileToPrompt(p: InvestorProfile, lang: "ru" | "en"): string {
  if (lang === "ru") {
    const hor = { short: "краткосрочный (менее 1 года)", medium: "среднесрочный (1–5 лет)", long: "долгосрочный (более 5 лет)" }[p.horizon];
    const risk = { conservative: "консервативный", moderate: "умеренный", aggressive: "агрессивный" }[p.risk];
    const goal = { income: "получение дохода (дивиденды, купоны)", growth: "рост капитала", speculation: "спекуляция" }[p.goal];
    return `\n\nПРОФИЛЬ ИНВЕСТОРА: горизонт — ${hor}; отношение к риску — ${risk}; цель — ${goal}. Учитывай этот профиль при формировании рекомендации.`;
  }
  const hor = { short: "short-term (<1 year)", medium: "mid-term (1–5 years)", long: "long-term (>5 years)" }[p.horizon];
  const risk = { conservative: "conservative", moderate: "moderate", aggressive: "aggressive" }[p.risk];
  const goal = { income: "income (dividends, coupons)", growth: "capital growth", speculation: "speculation" }[p.goal];
  return `\n\nINVESTOR PROFILE: horizon — ${hor}; risk tolerance — ${risk}; goal — ${goal}. Factor this profile into your recommendation.`;
}

export function useInvestorProfile(userId?: string) {
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const [profile, setProfile] = useState<InvestorProfile>(() => load(userId));

  useEffect(() => {
    const prev = prevUserIdRef.current;
    prevUserIdRef.current = userId;
    if (prev !== userId) {
      // Reload profile scoped to the new user (or reset to default on logout)
      setProfile(load(userId));
    }
  }, [userId]);

  const save = useCallback((p: InvestorProfile) => {
    setProfile(p);
    try { localStorage.setItem(storageKey(userId), JSON.stringify(p)); } catch {}
  }, [userId]);

  return { profile, save };
}
