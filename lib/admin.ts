import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env, serverNow } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Credentials & rate limit
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  // Hash first so both buffers have the same length (timingSafeEqual requirement).
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminCredentials(user: string, password: string): boolean {
  const userOk = safeEqual(user, env.adminUser);
  const passOk = safeEqual(password, env.adminPassword);
  return userOk && passOk;
}

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, number[]>();

/** In-memory limiter: 5 attempts per minute per IP. Returns seconds to wait (0 = allowed). */
export function registerLoginAttempt(ip: string): number {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(ip, recent);
    return Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
  }
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) {
    for (const [key, list] of attempts) {
      if (list.every((t) => now - t >= WINDOW_MS)) attempts.delete(key);
    }
  }
  return 0;
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 100;
const FETCH_CHUNK = 1000; // PostgREST max rows per request

export interface DaySummary {
  game_date: string;
  word: string;
  category: string;
  started: number;
  won: number;
  lost_errors: number;
  lost_timeout: number;
  playing: number;
}

export interface ParticipantRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  last_seen_at: string;
  days_played: number;
  days_won: number;
  phone_dup_count: number;
  total_count: number;
}

export interface ResultRow {
  play_id: string;
  game_date: string;
  full_name: string;
  email: string;
  phone: string;
  status: "playing" | "won" | "lost";
  lost_reason: "errors" | "timeout" | null;
  wrong_count: number;
  guessed_letters: string[];
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  win_code: string | null;
  total_count: number;
}

/** Closes expired plays so stats reflect timeouts of players who never came back. */
export async function expirePlays(): Promise<void> {
  const fake = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_NOW;
  const { error } = await supabaseAdmin().rpc("expire_plays", {
    p_now: fake ? serverNow().toISOString() : undefined,
  });
  if (error) throw new Error(error.message);
}

export async function getSummary(): Promise<{ totalParticipants: number; days: DaySummary[] }> {
  await expirePlays();
  const db = supabaseAdmin();
  const [{ count, error: countError }, { data, error }] = await Promise.all([
    db.from("participants").select("id", { count: "exact", head: true }),
    db.rpc("admin_day_summary"),
  ]);
  if (countError) throw new Error(countError.message);
  if (error) throw new Error(error.message);
  return { totalParticipants: count ?? 0, days: (data ?? []) as DaySummary[] };
}

export async function getParticipantsPage(search: string, page: number) {
  const { data, error } = await supabaseAdmin().rpc("admin_participants", {
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ParticipantRow[];
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export async function getResultsPage(date: string, search: string, page: number) {
  await expirePlays();
  const { data, error } = await supabaseAdmin().rpc("admin_results", {
    p_date: date,
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ResultRow[];
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export interface DailyWordRow {
  game_date: string;
  word: string;
  category: string;
  time_limit_seconds: number;
}

export async function getDailyWords(): Promise<DailyWordRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("daily_words")
    .select("game_date, word, category, time_limit_seconds")
    .order("game_date");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Creates or replaces the word of a day. Callers must check `isWordEditable` first. */
export async function saveDailyWord(row: DailyWordRow): Promise<DailyWordRow> {
  const { data, error } = await supabaseAdmin()
    .from("daily_words")
    .upsert(row, { onConflict: "game_date" })
    .select("game_date, word, category, time_limit_seconds")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllParticipants(): Promise<ParticipantRow[]> {
  const out: ParticipantRow[] = [];
  for (let offset = 0; ; offset += FETCH_CHUNK) {
    const { data, error } = await supabaseAdmin().rpc("admin_participants", {
      p_limit: FETCH_CHUNK,
      p_offset: offset,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ParticipantRow[];
    out.push(...rows);
    if (rows.length < FETCH_CHUNK) return out;
  }
}

export async function getAllResults(date?: string): Promise<ResultRow[]> {
  await expirePlays();
  const out: ResultRow[] = [];
  for (let offset = 0; ; offset += FETCH_CHUNK) {
    const { data, error } = await supabaseAdmin().rpc("admin_results", {
      p_date: date,
      p_limit: FETCH_CHUNK,
      p_offset: offset,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ResultRow[];
    out.push(...rows);
    if (rows.length < FETCH_CHUNK) return out;
  }
}

// ---------------------------------------------------------------------------
// Ronda bonus
// ---------------------------------------------------------------------------

export interface BonusSummary {
  id: string;
  eligibleDate: string;
  word: string;
  category: string;
  opensAt: string;
  closesAt: string;
  timeLimitSeconds: number;
  started: number;
  won: number;
  lostErrors: number;
  lostTimeout: number;
  playing: number;
}

/** Rounds with their counters. Empty if the bonus tables don't exist yet. */
export async function getBonusSummaries(): Promise<BonusSummary[]> {
  const db = supabaseAdmin();
  const [rounds, plays] = await Promise.all([
    db.from("bonus_rounds").select("*").order("opens_at"),
    db.from("bonus_plays").select("round_id, status, lost_reason, deadline_at").limit(10000),
  ]);
  if (rounds.error || plays.error) return [];
  const now = Date.now();
  return (rounds.data ?? []).map((r) => {
    const mine = (plays.data ?? []).filter((p) => p.round_id === r.id);
    const expired = (p: (typeof mine)[number]) =>
      p.status === "playing" && Date.parse(p.deadline_at) <= now;
    return {
      id: r.id,
      eligibleDate: r.eligible_date,
      word: r.word,
      category: r.category,
      opensAt: r.opens_at,
      closesAt: r.closes_at,
      timeLimitSeconds: r.time_limit_seconds,
      started: mine.length,
      won: mine.filter((p) => p.status === "won").length,
      lostErrors: mine.filter((p) => p.status === "lost" && p.lost_reason === "errors").length,
      lostTimeout: mine.filter(
        (p) => (p.status === "lost" && p.lost_reason === "timeout") || expired(p),
      ).length,
      playing: mine.filter((p) => p.status === "playing" && !expired(p)).length,
    };
  });
}

/** Bonus plays in the same shape as the daily results (game_date = round id). */
export async function getBonusResults(): Promise<ResultRow[]> {
  const db = supabaseAdmin();
  const plays = await db.from("bonus_plays").select("*").order("finished_at").limit(10000);
  if (plays.error || !plays.data?.length) return [];
  const ids = [...new Set(plays.data.map((p) => p.participant_id))];
  const people = new Map<string, { full_name: string; email: string; phone: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db
      .from("participants")
      .select("id, full_name, email, phone")
      .in("id", ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) people.set(p.id, p);
  }
  const now = Date.now();
  return plays.data.map((p) => {
    const who = people.get(p.participant_id);
    const timedOut = p.status === "playing" && Date.parse(p.deadline_at) <= now;
    return {
      play_id: p.id,
      game_date: p.round_id,
      full_name: who?.full_name ?? "",
      email: who?.email ?? "",
      phone: who?.phone ?? "",
      status: (timedOut ? "lost" : p.status) as ResultRow["status"],
      lost_reason: (timedOut ? "timeout" : p.lost_reason) as ResultRow["lost_reason"],
      wrong_count: p.wrong_count,
      guessed_letters: p.guessed_letters,
      started_at: p.started_at,
      finished_at: timedOut ? p.deadline_at : p.finished_at,
      duration_ms: p.duration_ms,
      win_code: p.win_code,
      total_count: plays.data.length,
    };
  });
}
