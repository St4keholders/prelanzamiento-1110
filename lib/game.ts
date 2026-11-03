import "server-only";
import type { Database } from "@/lib/database.types";
import { getFakeNow, serverNow } from "@/lib/env";
import type { GameState, LostReason, PlayStatus, PublicPlay, PublicPlayer } from "@/lib/game-types";
import { supabaseAdmin } from "@/lib/supabase";
import {
  LAST_DATE,
  START,
  getDayNumber,
  getGameDate,
  getPhase,
  nextMidnightBogota,
} from "@/lib/time";
import { buildMask, classifyGuesses } from "@/lib/word";

type PlayRow = Database["public"]["Tables"]["plays"]["Row"];
type WordRow = Database["public"]["Tables"]["daily_words"]["Row"];
type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];

export class GameError extends Error {
  constructor(
    public code: "unauthorized" | "not_active" | "no_word" | "not_today" | "internal",
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** ISO string for the SQL `p_now` override, or undefined so Postgres uses now(). */
function sqlNow(): string | undefined {
  return getFakeNow()?.toISOString();
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}***@${domain}`;
}

export async function getParticipant(id: string): Promise<ParticipantRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("participants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new GameError("internal", error.message, 500);
  return data;
}

function toPublicPlayer(p: ParticipantRow): PublicPlayer {
  return { fullName: p.full_name, maskedEmail: maskEmail(p.email) };
}

function toPublicPlay(play: PlayRow, word: WordRow): PublicPlay {
  const { correct, wrong } = classifyGuesses(word.word, play.guessed_letters);
  return {
    gameDate: play.game_date,
    status: play.status as PlayStatus,
    lostReason: (play.lost_reason as LostReason | null) ?? null,
    guessedLetters: play.guessed_letters,
    correctLetters: correct,
    wrongLetters: wrong,
    livesLeft: Math.max(0, word.max_errors - play.wrong_count),
    startedAt: play.started_at,
    deadlineAt: play.deadline_at,
    finishedAt: play.finished_at,
    durationMs: play.duration_ms,
    winCode: play.win_code,
  };
}

async function getWord(date: string): Promise<WordRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("daily_words")
    .select("*")
    .eq("game_date", date)
    .maybeSingle();
  if (error) throw new GameError("internal", error.message, 500);
  return data;
}

/** Returns the play for (participant, date), marking it as timed out if its deadline passed. */
async function refreshPlay(pid: string, date: string): Promise<PlayRow | null> {
  const { data, error } = await supabaseAdmin().rpc("refresh_play", {
    p_participant: pid,
    p_date: date,
    p_now: sqlNow(),
  });
  if (error) throw new GameError("internal", error.message, 500);
  return data?.[0] ?? null;
}

/**
 * A play still running (deadline in the future) takes precedence over the calendar day,
 * so a play started at 11:59 PM can be finished after midnight.
 */
async function findRunningPlay(pid: string, now: Date): Promise<PlayRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("plays")
    .select("*")
    .eq("participant_id", pid)
    .eq("status", "playing")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new GameError("internal", error.message, 500);
  if (!data) return null;
  if (new Date(data.deadline_at).getTime() > now.getTime()) return data;
  await refreshPlay(pid, data.game_date);
  return null;
}

function buildActiveState(
  now: Date,
  player: PublicPlayer,
  word: WordRow,
  play: PlayRow | null,
): GameState {
  const today = getGameDate(now);
  return {
    phase: "active",
    serverNow: now.toISOString(),
    player,
    day: {
      number: getDayNumber(word.game_date) ?? 0,
      date: word.game_date,
      category: word.category,
      mask: buildMask(word.word, play?.guessed_letters ?? []),
      timeLimitSeconds: word.time_limit_seconds,
      maxErrors: word.max_errors,
      isLastDay: word.game_date === LAST_DATE,
    },
    play: play ? toPublicPlay(play, word) : null,
    isToday: word.game_date === today,
    nextWordAt: nextMidnightBogota(now).toISOString(),
  };
}

/** Resolves which date the player is acting on right now. */
async function resolveDate(pid: string, now: Date): Promise<string> {
  const running = await findRunningPlay(pid, now);
  if (running) return running.game_date;
  if (getPhase(now) !== "active") {
    throw new GameError("not_active", "El reto no está activo en este momento.", 403);
  }
  return getGameDate(now);
}

export async function getGameState(pid: string): Promise<GameState> {
  const participant = await getParticipant(pid);
  if (!participant) throw new GameError("unauthorized", "Sesión no válida.", 401);
  const player = toPublicPlayer(participant);
  const now = serverNow();

  const running = await findRunningPlay(pid, now);
  if (running) {
    const word = await getWord(running.game_date);
    if (word) return buildActiveState(now, player, word, running);
  }

  const phase = getPhase(now);
  if (phase === "before") {
    return { phase, serverNow: now.toISOString(), player, startsAt: START.toISOString() };
  }
  if (phase === "ended") {
    return { phase, serverNow: now.toISOString(), player };
  }

  const date = getGameDate(now);
  const word = await getWord(date);
  if (!word) {
    return {
      phase: "active",
      noWord: true,
      serverNow: now.toISOString(),
      player,
      nextWordAt: nextMidnightBogota(now).toISOString(),
    };
  }
  const play = await refreshPlay(pid, date);
  return buildActiveState(now, player, word, play);
}

function mapRpcError(message: string): GameError {
  if (message.includes("not_today")) {
    return new GameError("not_today", "Solo puedes jugar la palabra de hoy.", 409);
  }
  if (message.includes("no_word")) {
    return new GameError("no_word", "La palabra de hoy aún no está disponible.", 409);
  }
  return new GameError("internal", "No pudimos procesar tu jugada. Intenta de nuevo.", 500);
}

async function stateAfter(pid: string, date: string, play: PlayRow): Promise<GameState> {
  const [participant, word] = await Promise.all([getParticipant(pid), getWord(date)]);
  if (!participant) throw new GameError("unauthorized", "Sesión no válida.", 401);
  if (!word) throw new GameError("no_word", "La palabra de hoy aún no está disponible.", 409);
  return buildActiveState(serverNow(), toPublicPlayer(participant), word, play);
}

export async function startGame(pid: string): Promise<GameState> {
  const date = await resolveDate(pid, serverNow());
  const { data, error } = await supabaseAdmin().rpc("start_play", {
    p_participant: pid,
    p_date: date,
    p_now: sqlNow(),
  });
  if (error) throw mapRpcError(error.message);
  return stateAfter(pid, date, data as PlayRow);
}

export async function guessLetter(pid: string, letter: string): Promise<GameState> {
  const date = await resolveDate(pid, serverNow());
  const { data, error } = await supabaseAdmin().rpc("apply_guess", {
    p_participant: pid,
    p_date: date,
    p_letter: letter,
    p_now: sqlNow(),
  });
  if (error) throw mapRpcError(error.message);
  return stateAfter(pid, date, data as PlayRow);
}
