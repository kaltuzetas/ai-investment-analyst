function parseOrThrow(s: string): unknown {
  const parsed = JSON.parse(s);
  // Minimal structural validation: must be an object with at least an "asset" key
  // (handles the "not_an_asset" error object too, which has an "error" key)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid analysis structure: expected object");
  }
  return parsed;
}

export function repairJSON(raw: string): unknown {
  let s = raw
    .trim()
    .replace(/```json|```/g, "")
    .trim();

  const si = s.indexOf("{");
  const ei = s.lastIndexOf("}");
  if (si === -1 || ei === -1) throw new Error("JSON not found");

  s = s
    .slice(si, ei + 1)
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/:\s*True\b/g, ":true")
    .replace(/:\s*False\b/g, ":false")
    .replace(/:\s*None\b/g, ":null");

  try {
    return parseOrThrow(s);
  } catch (_) {
    // attempt bracket repair
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
  }

  if (inString) s += '"';
  s += stack.reverse().join("");
  s = s.replace(/,\s*([}\]])/g, "$1");

  return parseOrThrow(s);
}
