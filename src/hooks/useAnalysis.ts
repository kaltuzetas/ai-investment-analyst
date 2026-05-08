import { useState, useCallback, useEffect, useRef } from "react";
import { AnalysisData, Lang } from "@/types";
import { TR } from "@/constants/translations";
import { makeSysPrompt } from "@/prompts/systemPrompt";
import { InvestorProfile } from "@/hooks/useInvestorProfile";
import { validateQuery, getValidationMessage } from "@/utils/validate";
import { cacheKey, getFromCache, putInCache, formatCacheAge } from "@/hooks/useCache";
import { callAPI } from "@/utils/apiCall";

/** Interval between successive loading stage messages (ms) */
const STAGE_INTERVAL_MS = 1400;

export function useAnalysis(lang: Lang, profile?: InvestorProfile, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [cacheAge, setCacheAge] = useState<string | null>(null); // null = fresh data
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const analyzeCtrl = useRef<AbortController | null>(null);
  const callCountRef = useRef(0);

  // Clear stage timers and abort in-flight request on unmount
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    analyzeCtrl.current?.abort();
  }, []);

  const analyze = useCallback(
    async (query: string, forceRefresh = false) => {
      const validation = validateQuery(query);
      if (!validation.valid) {
        setError(getValidationMessage(validation.reason as never, lang));
        return;
      }

      const key = cacheKey(query, lang, userId);

      // Return cached result if available and not forcing refresh
      if (!forceRefresh) {
        const cached = getFromCache(key);
        if (cached) {
          setResult(cached.data);
          setError(null);
          setCacheAge(formatCacheAge(cached.ageMs, lang));
          return;
        }
      }

      analyzeCtrl.current?.abort();
      analyzeCtrl.current = new AbortController();
      const signal = analyzeCtrl.current.signal;
      // [FIX] Track the active call so the finally block of an aborted call does not
      // reset loading/stage state that a newer call already set to true.
      const callId = ++callCountRef.current;

      timers.current.forEach(clearTimeout);
      setLoading(true);
      setError(null);
      setResult(null);
      setCacheAge(null);
      setStageIndex(0);

      const stages = [...(TR[lang]?.stages ?? TR.ru.stages)];
      // Capture timers in a local variable to avoid a race condition where the finally
      // block of an aborted call clears the timers of the next call that already started.
      const myTimers = stages.map((msg, i) =>
        setTimeout(() => { setStage(msg); setStageIndex(i + 1); }, (i + 1) * STAGE_INTERVAL_MS)
      );
      timers.current = myTimers;

      try {
        const ru = lang !== "en";
        const userMsg = ru
          ? `Проанализируй актив ТОЛЬКО НА РУССКОМ языке: ${query.trim()}. Найди текущие данные, макро, историю 3/5/10 лет, позицию в волнах Кондратьева, технический анализ и сентимент.`
          : `Analyze asset IN ENGLISH ONLY: ${query.trim()}. Find current data, macro, 3/5/10 year history, Kondratiev wave position, technical analysis, sentiment.`;

        const data = (await callAPI(
          [{ role: "user", content: userMsg }],
          makeSysPrompt(lang, profile),
          signal,
          1,
          forceRefresh
        )) as AnalysisData;

        // Claude signalled this is not a financial asset
        if ((data as unknown as Record<string, unknown>).error === "not_an_asset") {
          throw new Error("NOT_AN_ASSET");
        }

        // Sanity-check: response must be a non-null object with at least an asset block
        if (typeof data !== "object" || data === null || !(data as unknown as Record<string, unknown>).asset) {
          throw new Error("Invalid response structure from API");
        }

        putInCache(key, data);
        myTimers.forEach(clearTimeout);
        setResult(data);
        setCacheAge(null);
      } catch (e) {
        // Ignore abort errors — component unmounted or query was superseded
        if ((e as Error).name === "AbortError") return;
        const msg = (e as Error).message;
        if (msg === "NOT_AN_ASSET") {
          setError((TR[lang] as unknown as Record<string, string>)["errNotAsset"] ?? "Not a financial asset.");
        } else if (msg === "AUTH_REQUIRED") {
          setError((TR[lang] as unknown as Record<string, string>)["errAuthRequired"] ?? "Sign in to analyze.");
        } else if (msg === "EMAIL_NOT_CONFIRMED") {
          setError((TR[lang] as unknown as Record<string, string>)["errEmailNotConfirmed"] ?? "Please confirm your email to continue.");
        } else if (msg === "FREE_LIMIT_REACHED") {
          setLimitReached(true);
        } else if (msg.startsWith("Request timed out")) {
          setError((TR[lang] as unknown as Record<string, string>)["errTimeout"] ?? "Request timed out. Please try again.");
        } else if (msg.startsWith("Network error") || msg === "Failed to fetch") {
          setError((TR[lang] as unknown as Record<string, string>)["errNetwork"] ?? "Network error. Check your connection.");
        } else {
          // Generic fallback — do not expose raw API/HTTP details to the user
          setError((TR[lang] as unknown as Record<string, string>)["errGeneric"] ?? "Something went wrong. Please try again.");
        }
      } finally {
        myTimers.forEach(clearTimeout);
        // Only reset loading/stage if this is still the active call. An aborted call's
        // finally block runs after the new call has already set setLoading(true), so
        // without this guard the spinner briefly disappears mid-analysis.
        if (callCountRef.current === callId) {
          setLoading(false);
          setStage("");
        }
      }
    },
    [lang, profile, userId]
  );

  return { loading, stage, stageIndex, result, error, limitReached, setLimitReached, cacheAge, analyze, setResult };
}
