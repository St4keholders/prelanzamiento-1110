import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { longestStreak } from "@/lib/ranking-utils";
import type { MyRanking, RankingRow } from "@/lib/team-types";
import { allGameDates, getDayNumber } from "@/lib/time";
import { MULTI_WINNER_DATE } from "@/lib/winner-rules";
import { getOfficialWinners } from "@/lib/winners";

function db(): SupabaseClient {
  return supabaseAdmin() as unknown as SupabaseClient;
}

interface RankRpcRow {
  participant_id: string;
  full_name: string;
  won: number;
  played: number;
  total_ms: number;
  best_ms: number | null;
  lives_lost: number;
  rank_position: number;
}

const CACHE_MS = 30_000;
let cache: { at: number; rows: (RankingRow & { participantId: string })[] } | null = null;

/** Full ranking (the 11 words; bonus excluded). Cached 30 s per instance — the game is over. */
export async function getRanking(): Promise<(RankingRow & { participantId: string })[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const { data, error } = await db().rpc("ranking_table");
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as RankRpcRow[])
    .map((r) => ({
      participantId: r.participant_id,
      position: Number(r.rank_position),
      name: r.full_name,
      won: r.won,
      played: r.played,
      totalMs: Number(r.total_ms),
      bestMs: r.best_ms,
      livesLost: r.lives_lost,
    }))
    .sort((a, b) => a.position - b.position);
  cache = { at: Date.now(), rows };
  return rows;
}

export async function getMyRanking(pid: string): Promise<MyRanking | null> {
  const rows = await getRanking();
  const mine = rows.find((r) => r.participantId === pid);
  if (!mine) return null;
  const { data } = await db().from("plays").select("game_date, status").eq("participant_id", pid);
  const byDate = new Map((data ?? []).map((p: { game_date: string; status: string }) => [p.game_date, p.status]));
  const days = allGameDates().map((d) => {
    const s = byDate.get(d);
    return s === "won" ? "won" : s ? "lost" : "missed";
  }) as MyRanking["days"];
  return { ...mine, totalPlayers: rows.length, longestStreak: longestStreak(days), days };
}

export interface DayWinners {
  date: string;
  dayNumber: number;
  /** Día 1: everyone who guessed won. */
  multi: boolean;
  winners: { name: string; durationMs: number | null }[];
}

export interface WinnersBoard {
  days: DayWinners[];
  bonus: {
    winner: { name: string; durationMs: number | null } | null;
    top: { position: number; name: string; durationMs: number | null }[];
    played: number;
    guessed: number;
    label: string;
  } | null;
}

/** Prize winners: first to answer each day (Día 1: everybody who guessed) + bonus round. */
export async function getWinnersBoard(): Promise<WinnersBoard> {
  const [official, day1] = await Promise.all([
    getOfficialWinners(),
    db()
      .from("plays")
      .select("participant_id, duration_ms, finished_at")
      .eq("game_date", MULTI_WINNER_DATE)
      .eq("status", "won")
      .order("finished_at"),
  ]);
  const day1Rows = (day1.data ?? []) as { participant_id: string; duration_ms: number | null }[];
  const names = new Map<string, string>();
  if (day1Rows.length) {
    const ids = day1Rows.map((r) => r.participant_id);
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await db().from("participants").select("id, full_name").in("id", ids.slice(i, i + 200));
      for (const p of data ?? []) names.set(p.id, p.full_name);
    }
  }

  const days: DayWinners[] = allGameDates().map((date) => {
    if (date === MULTI_WINNER_DATE) {
      return {
        date,
        dayNumber: 1,
        multi: true,
        winners: day1Rows.map((r) => ({ name: names.get(r.participant_id) ?? "", durationMs: r.duration_ms })),
      };
    }
    const w = official.get(date);
    return {
      date,
      dayNumber: getDayNumber(date) ?? 0,
      multi: false,
      winners: w ? [{ name: w.fullName, durationMs: w.durationMs }] : [],
    };
  });

  // Ronda bonus (apartado propio; no cuenta en el ranking).
  let bonus: WinnersBoard["bonus"] = null;
  const rounds = await db().from("bonus_rounds").select("id, eligible_date").order("opens_at").limit(1);
  const round = rounds.data?.[0] as { id: string; eligible_date: string } | undefined;
  if (round) {
    const plays = await db()
      .from("bonus_plays")
      .select("participant_id, status, duration_ms, finished_at")
      .eq("round_id", round.id);
    const all = (plays.data ?? []) as { participant_id: string; status: string; duration_ms: number | null }[];
    const won = all
      .filter((p) => p.status === "won")
      .sort((a, b) => (a.duration_ms ?? Infinity) - (b.duration_ms ?? Infinity));
    const ids = won.slice(0, 10).map((p) => p.participant_id);
    const bn = new Map<string, string>();
    if (ids.length) {
      const { data } = await db().from("participants").select("id, full_name").in("id", ids);
      for (const p of data ?? []) bn.set(p.id, p.full_name);
    }
    const w = official.get(round.id);
    const [, , d] = round.eligible_date.split("-");
    bonus = {
      winner: w ? { name: w.fullName, durationMs: w.durationMs } : null,
      top: won.slice(0, 10).map((p, i) => ({
        position: i + 1,
        name: bn.get(p.participant_id) ?? "",
        durationMs: p.duration_ms,
      })),
      played: all.length,
      guessed: won.length,
      label: `Ronda bonus · ${Number(d)} de noviembre`,
    };
  }

  return { days, bonus };
}
