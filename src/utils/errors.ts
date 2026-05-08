export type ErrorKind =
  | "network"
  | "timeout"
  | "server"
  | "rate_limit"
  | "overloaded"
  | "not_found"
  | "parse"
  | "unknown";

export interface AppError {
  kind: ErrorKind;
  message: string;
  retryable: boolean;
}

const SAFE_MSG: Record<ErrorKind, string> = {
  network:    "network error",
  timeout:    "request timed out",
  rate_limit: "rate limit exceeded",
  overloaded: "service overloaded",
  server:     "server error",
  not_found:  "not found",
  parse:      "parse error",
  unknown:    "unknown error",
};

export function classifyError(raw: Error | string): AppError {
  const msg = (typeof raw === "string" ? raw : raw.message).toLowerCase();

  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed"))
    return { kind: "network", message: SAFE_MSG.network, retryable: true };

  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted"))
    return { kind: "timeout", message: SAFE_MSG.timeout, retryable: true };

  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many"))
    return { kind: "rate_limit", message: SAFE_MSG.rate_limit, retryable: false };

  if (msg.includes("529") || msg.includes("overloaded") || msg.includes("busy"))
    return { kind: "overloaded", message: SAFE_MSG.overloaded, retryable: true };

  if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("server error"))
    return { kind: "server", message: SAFE_MSG.server, retryable: true };

  if (msg.includes("json") || msg.includes("parse") || msg.includes("not found") || msg.includes("empty response"))
    return { kind: "parse", message: SAFE_MSG.parse, retryable: true };

  return { kind: "unknown", message: SAFE_MSG.unknown, retryable: true };
}

export const ERROR_LABELS: Record<ErrorKind, Record<"ru" | "en", { title: string; hint: string }>> = {
  network: {
    ru: { title: "Нет соединения", hint: "Проверьте интернет и попробуйте ещё раз" },
    en: { title: "No connection", hint: "Check your internet and try again" },
  },
  timeout: {
    ru: { title: "Сервер не ответил вовремя", hint: "Запрос занял слишком долго — попробуйте снова" },
    en: { title: "Request timed out", hint: "The request took too long — please retry" },
  },
  rate_limit: {
    ru: { title: "Превышен лимит запросов", hint: "Подождите минуту перед следующим анализом" },
    en: { title: "Rate limit reached", hint: "Wait a minute before the next analysis" },
  },
  overloaded: {
    ru: { title: "AI-сервис перегружен", hint: "Слишком много запросов прямо сейчас — подождите 30 секунд и попробуйте снова" },
    en: { title: "AI service is busy", hint: "Too many requests right now — wait 30 seconds and try again" },
  },
  server: {
    ru: { title: "Ошибка сервера", hint: "Временный сбой на стороне API — обычно проходит за несколько секунд" },
    en: { title: "Server error", hint: "Temporary API issue — usually resolves in a few seconds" },
  },
  not_found: {
    ru: { title: "Актив не найден", hint: "Проверьте правильность тикера или попробуйте полное название" },
    en: { title: "Asset not found", hint: "Check the ticker spelling or try the full name" },
  },
  parse: {
    ru: { title: "Не удалось обработать ответ", hint: "Попробуйте ещё раз — обычно помогает повторный запрос" },
    en: { title: "Could not process response", hint: "Try again — a retry usually fixes this" },
  },
  unknown: {
    ru: { title: "Что-то пошло не так", hint: "Попробуйте ещё раз" },
    en: { title: "Something went wrong", hint: "Please try again" },
  },
};
