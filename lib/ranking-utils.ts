/** Pure helpers for the ranking (unit tested). */

/** Longest run of consecutive "won" days. */
export function longestStreak(days: readonly string[]): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d === "won" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** "Sebastián Avila" → "Sebastián A." (not used for the public top 10, kept for small spaces). */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}
