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
