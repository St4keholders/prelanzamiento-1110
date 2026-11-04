import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { MULTI_WINNER_DATE, type WonPlay, pickDayWinners } from "@/lib/winner-rules";

export interface OfficialWinner {
  /** Same as participantId; lets the map be used with `titleStatus`. */
  key: string;
  participantId: string;
  email: string;
  fullName: string;
  gameDate: string;
  durationMs: number | null;
}

const PAGE = 1000; // PostgREST max rows per request
const CACHE_MS = 15_000;
let cache: { at: number; data: Map<string, OfficialWinner> } | null = null;

/**
 * Official single winner of each day from Día 2 on (see lib/winner-rules.ts).
 * Cached for a few seconds per server instance: waiting screens poll every minute.
 */
export async function getOfficialWinners(): Promise<Map<string, OfficialWinner>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const db = supabaseAdmin();
  const rows: WonPlay[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("plays")
      .select("id, participant_id, game_date, finished_at, duration_ms")
      .eq("status", "won")
      .gt("game_date", MULTI_WINNER_DATE)
      .order("game_date", { ascending: true })
      .order("finished_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      if (!r.finished_at) continue;
      rows.push({
        id: r.id,
        participantId: r.participant_id,
        gameDate: r.game_date,
        finishedAt: r.finished_at,
        durationMs: r.duration_ms,
      });
    }
    if ((data ?? []).length < PAGE) break;
  }

  const picks = pickDayWinners(rows);
  const ids = [...new Set([...picks.values()].map((w) => w.participantId))];
  const people = new Map<string, { email: string; full_name: string }>();
  if (ids.length > 0) {
    const { data, error } = await db
      .from("participants")
      .select("id, email, full_name")
      .in("id", ids);
    if (error) throw new Error(error.message);
    for (const p of data ?? []) people.set(p.id, p);
  }

  const result = new Map<string, OfficialWinner>();
  for (const [date, w] of picks) {
    const p = people.get(w.participantId);
    result.set(date, {
      key: w.participantId,
      participantId: w.participantId,
      email: p?.email ?? "",
      fullName: p?.full_name ?? "",
      gameDate: date,
      durationMs: w.durationMs,
    });
  }

  cache = { at: Date.now(), data: result };
  return result;
}

/** Same winners keyed by email (admin rows don't carry the participant id). */
export function byEmail(winners: Map<string, OfficialWinner>): Map<string, { key: string }> {
  return new Map([...winners].map(([date, w]) => [date, { key: w.email }]));
}
