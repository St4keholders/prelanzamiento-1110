/**
 * Word schedule (pure functions, unit tested).
 *
 * Each day's word has a start time (`daily_words.starts_at`, set in the admin panel).
 * A word can be played from its start until the next word starts; the last word stays
 * open 24 h. Days without a row start at 00:00 (hora Colombia) of their date.
 * The SQL function `ahd_current_date` applies exactly the same rule.
 */
import { type Phase, allGameDates } from "@/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayWindow {
  date: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ScheduleRow {
  game_date: string;
  starts_at: string | null;
}

/** 00:00 hora Colombia of `date` (UTC−5, no DST). */
export function midnightBogota(date: string): Date {
  return new Date(`${date}T00:00:00-05:00`);
}

/** `date` at "HH:MM" hora Colombia. */
export function startAt(date: string, hhmm: string): Date {
  return new Date(`${date}T${hhmm}:00-05:00`);
}

export function buildSchedule(rows: readonly ScheduleRow[]): DayWindow[] {
  const byDate = new Map(rows.map((r) => [r.game_date, r.starts_at]));
  const starts = allGameDates().map((date) => {
    const iso = byDate.get(date);
    return { date, startsAt: iso ? new Date(iso) : midnightBogota(date) };
  });
  return starts.map((s, i) => ({
    ...s,
    endsAt: i + 1 < starts.length ? starts[i + 1].startsAt : new Date(s.startsAt.getTime() + DAY_MS),
  }));
}

export function schedulePhase(schedule: readonly DayWindow[], now: Date): Phase {
  if (now.getTime() < schedule[0].startsAt.getTime()) return "before";
  if (now.getTime() >= schedule[schedule.length - 1].endsAt.getTime()) return "ended";
  return "active";
}

/** Window of the word that can be played at `now` (null before the start / after the end). */
export function currentWindow(schedule: readonly DayWindow[], now: Date): DayWindow | null {
  const t = now.getTime();
  return schedule.find((w) => w.startsAt.getTime() <= t && t < w.endsAt.getTime()) ?? null;
}

export function windowFor(schedule: readonly DayWindow[], date: string): DayWindow | null {
  return schedule.find((w) => w.date === date) ?? null;
}

/** A word (text, category, time and start) can be edited only before it starts. */
export function isStartEditable(startsAt: Date, now: Date): boolean {
  return now.getTime() < startsAt.getTime();
}

/** "12:00" (24 h, hora Colombia) — value for <input type="time">. */
export function toHHMM(d: Date): string {
  const b = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return `${String(b.getUTCHours()).padStart(2, "0")}:${String(b.getUTCMinutes()).padStart(2, "0")}`;
}

const startFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "11 nov, 12:00 p. m." */
export function formatStart(d: Date): string {
  return startFormatter.format(d);
}

const hourFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "12:00 p. m." */
export function formatHour(d: Date): string {
  return hourFormatter.format(d);
}
