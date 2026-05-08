/**
 * Merges a remote array with a local array, keeping remote entries authoritative
 * and appending any local-only entries (not yet synced) at the end.
 * Pass `max` to cap the result length (e.g. MAX_ITEMS per hook).
 */
export function mergeRemoteLocal<T extends { id: string }>(
  remote: T[],
  local: T[],
  max?: number
): T[] {
  // Deduplicate remote first (DB may return duplicate rows on certain RLS + upsert combos)
  const seen = new Set<string>();
  const deduped = remote.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  const localOnly = local.filter((l) => !seen.has(l.id));
  const merged = [...deduped, ...localOnly];
  return max !== undefined ? merged.slice(0, max) : merged;
}
