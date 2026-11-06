/**
 * Daily winner rules (pure functions, unit tested).
 *
 * - 2026-11-04 (Día 1): EVERYONE who guesses the word is a winner of the day.
 * - From 2026-11-05 on: one winner per day = the first person to guess the word (by
 *   finished_at) who has NOT already held the title on an earlier day. Each person can
 *   hold the title only once in the whole challenge (Día 1 does not count). If the
 *   fastest person already has a title, it goes to the next one.
 * - Bonus rounds ("2026-11-06-bonus") work like one more day, with the same single title:
 *   their key sorts right after the word of that date and before the next day.
 */

const BONUS_SUFFIX = "-bonus";

export function isBonusKey(key: string): boolean {
  return key.endsWith(BONUS_SUFFIX);
}

/** "el Día 3" / "la ronda bonus del 6 de noviembre" — for "Ya ganaste …". */
export function describeTitle(key: string): string {
  if (isBonusKey(key)) {
    const day = Number(key.slice(8, 10));
    return `la ronda bonus del ${day} de noviembre`;
  }
  return `el Día ${getDayNumber(key)}`;
}
import { FIRST_DATE, getDayNumber } from "@/lib/time";

export const MULTI_WINNER_DATE = FIRST_DATE;

export function isMultiWinnerDay(date: string): boolean {
  return date === MULTI_WINNER_DATE;
}

export interface WonPlay {
  id: string;
  participantId: string;
  /** Day date ("2026-11-05") or bonus round id ("2026-11-06-bonus"). */
  gameDate: string;
  finishedAt: string;
  durationMs: number | null;
}

export interface DayTitle {
  participantId: string;
  gameDate: string;
  durationMs: number | null;
}

/** Single-winner days only (Día 1 is ignored). Map: game_date → winner. */
export function pickDayWinners(rows: readonly WonPlay[]): Map<string, DayTitle> {
  const sorted = rows
    .filter((r) => !isMultiWinnerDay(r.gameDate))
    .sort(
      (a, b) =>
        (a.gameDate < b.gameDate ? -1 : a.gameDate > b.gameDate ? 1 : 0) ||
        Date.parse(a.finishedAt) - Date.parse(b.finishedAt) ||
        a.id.localeCompare(b.id),
    );

  const titled = new Set<string>();
  const winners = new Map<string, DayTitle>();
  for (const r of sorted) {
    if (winners.has(r.gameDate) || titled.has(r.participantId)) continue;
    winners.set(r.gameDate, {
      participantId: r.participantId,
      gameDate: r.gameDate,
      durationMs: r.durationMs,
    });
    titled.add(r.participantId);
  }
  return winners;
}

export type TitleStatus =
  | { kind: "multi" } // Día 1: won, everyone who guessed is a winner
  | { kind: "winner" } // official winner of this day
  | { kind: "already"; titleDate: string } // guessed it, but already holds an earlier title
  | { kind: "none" }; // did not win the title (or did not guess)

/** `key` identifies the person in `winners` (participant id, or email if the map is keyed so). */
export function titleStatus(
  key: string,
  gameDate: string,
  won: boolean,
  winners: ReadonlyMap<string, { key: string }>,
): TitleStatus {
  if (!won) return { kind: "none" };
  if (isMultiWinnerDay(gameDate)) return { kind: "multi" };
  if (winners.get(gameDate)?.key === key) return { kind: "winner" };
  for (const [date, w] of winners) {
    if (w.key === key && date < gameDate) return { kind: "already", titleDate: date };
  }
  return { kind: "none" };
}
