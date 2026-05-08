export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: "empty" | "too_short" | "too_long" | "invalid_chars" | "gibberish" };

export function validateQuery(raw: string): ValidationResult {
  const q = raw.trim();

  if (!q) return { valid: false, reason: "empty" };
  if (q.length < 2) return { valid: false, reason: "too_short" };
  if (q.length > 60) return { valid: false, reason: "too_long" };

  // Разрешены: буквы (латиница + кириллица), цифры, обычный пробел, дефис, точка
  // [FIX M-2] Убраны \w (включал underscore) и & (ломал URL-кодирование)
  // \s намеренно заменён на [ ] — не пропускаем tab/newline/carriage return в запросе
  if (!/^[A-Za-z0-9\u0400-\u04FF \-\.]+$/.test(q)) {
    return { valid: false, reason: "invalid_chars" };
  }

  // Бред-фильтр: только цифры без букв
  if (/^\d+$/.test(q)) return { valid: false, reason: "gibberish" };

  // Слишком много повторяющихся символов подряд (aaaaa, 11111)
  if (/(.)\1{4,}/.test(q)) return { valid: false, reason: "gibberish" };

  return { valid: true };
}

export function getValidationMessage(reason: ValidationResult extends { valid: false } ? ValidationResult["reason"] : never, lang: "ru" | "en"): string {
  const messages: Record<string, Record<"ru" | "en", string>> = {
    empty:         { ru: "Введите тикер или название актива", en: "Enter a ticker or asset name" },
    too_short:     { ru: "Слишком короткий запрос — минимум 2 символа", en: "Too short — minimum 2 characters" },
    too_long:      { ru: "Запрос слишком длинный — максимум 60 символов", en: "Query too long — max 60 characters" },
    invalid_chars: { ru: "Недопустимые символы — используйте буквы, цифры и дефис", en: "Invalid characters — use letters, numbers and hyphens" },
    gibberish:     { ru: "Не похоже на тикер или название актива", en: "Doesn't look like a ticker or asset name" },
  };
  return messages[reason]?.[lang] ?? "Invalid input";
}
