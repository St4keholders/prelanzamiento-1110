import "server-only";
import { type DayWindow, buildSchedule } from "@/lib/schedule";
import { supabaseAdmin } from "@/lib/supabase";

const CACHE_MS = 10_000;
let cache: { at: number; data: DayWindow[] } | null = null;

/** The 11 day windows (start / end of each word). Cached a few seconds per instance. */
export async function getSchedule(): Promise<DayWindow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const { data, error } = await supabaseAdmin()
    .from("daily_words")
    .select("game_date, starts_at")
    .order("game_date");
  if (error) throw new Error(error.message);
  const schedule = buildSchedule(data ?? []);
  cache = { at: Date.now(), data: schedule };
  return schedule;
}

/** Call after the admin edits a word so the new start applies right away. */
export function clearScheduleCache(): void {
  cache = null;
}
