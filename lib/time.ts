/**
 * Challenge calendar and time helpers. Colombia (America/Bogota) is a fixed UTC−5
 * offset with no DST, but we still use Intl so the logic stays explicit.
 */

export const TIMEZONE = "America/Bogota";
export const START = new Date("2026-11-04T05:00:00Z"); // 2026-11-04 00:00 Bogotá
export const END_EXCLUSIVE = new Date("2026-11-15T05:00:00Z"); // 2026-11-15 00:00 Bogotá
export const FIRST_DATE = "2026-11-04";
export const LAST_DATE = "2026-11-14";
export const TOTAL_DAYS = 11;

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Phase = "before" | "active" | "ended";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of `now` in Bogotá. */
export function getGameDate(now: Date): string {
  return dateFormatter.format(now);
}

export function getPhase(now: Date): Phase {
  const t = now.getTime();
  if (t < START.getTime()) return "before";
  if (t >= END_EXCLUSIVE.getTime()) return "ended";
  return "active";
}

/** Day number 1..11 for a YYYY-MM-DD date (null if outside the challenge). */
export function getDayNumber(date: string): number | null {
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${FIRST_DATE}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  const n = Math.round(ms / DAY_MS) + 1;
  return n >= 1 && n <= TOTAL_DAYS ? n : null;
}

/** Next 00:00 Bogotá strictly after `now`. */
export function nextMidnightBogota(now: Date): Date {
  const local = now.getTime() - BOGOTA_OFFSET_MS; // shift so UTC fields == Bogotá fields
  const startOfLocalDay = Math.floor(local / DAY_MS) * DAY_MS;
  return new Date(startOfLocalDay + DAY_MS + BOGOTA_OFFSET_MS);
}

const longDateFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "6 de noviembre de 2026" for a YYYY-MM-DD date. */
export function formatLongDate(date: string): string {
  return longDateFormatter.format(new Date(`${date}T12:00:00Z`));
}

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/** Clock time in Bogotá, e.g. "3:07:15 p. m.". */
export function formatTimeBogota(iso: string | Date): string {
  return timeFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** "06/11/2026, 15:07:15" in Bogotá (for admin tables/exports). */
export function formatDateTimeBogota(iso: string | null | undefined): string {
  if (!iso) return "";
  return dateTimeFormatter.format(new Date(iso));
}

/** "1:23" or "45 s" style human duration. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")} s` : `${s} s`;
}

/** All challenge dates, YYYY-MM-DD. */
export function allGameDates(): string[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) =>
    new Date(Date.parse(`${FIRST_DATE}T00:00:00Z`) + i * DAY_MS).toISOString().slice(0, 10),
  );
}

export function isGameDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && getDayNumber(date) !== null;
}
