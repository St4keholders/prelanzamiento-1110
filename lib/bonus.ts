import "server-only";
import type { Database } from "@/lib/database.types";
import { getFakeNow } from "@/lib/env";
import { GameError } from "@/lib/game-error";
import type { LostReason, PlayStatus, PublicBonus, PublicPlay } from "@/lib/game-types";
import { supabaseAdmin } from "@/lib/supabase";
import { titleStatus } from "@/lib/winner-rules";
import { getOfficialWinners } from "@/lib/winners";
import { buildMask, classifyGuesses } from "@/lib/word";

type BonusRound = Database["public"]["Tables"]["bonus_rounds"]["Row"];
type BonusPlay = Database["public"]["Tables"]["bonus_plays"]["Row"];

function sqlNow(): string | undefined {
  return getFakeNow()?.toISOString();
}

function toPublicBonusPlay(play: BonusPlay, round: BonusRound): PublicPlay {
  const { correct, wrong } = classifyGuesses(round.word, play.guessed_letters);
  return {
    gameDate: round.eligible_date,
    status: play.status as PlayStatus,
    lostReason: (play.lost_reason as LostReason | null) ?? null,
    guessedLetters: play.guessed_letters,
    correctLetters: correct,
    wrongLetters: wrong,
    livesLeft: Math.max(0, round.max_errors - play.wrong_count),
    startedAt: play.started_at,
    deadlineAt: play.deadline_at,
    finishedAt: play.finished_at,
    durationMs: play.duration_ms,
    winCode: play.win_code,
  };
}

async function getRound(id: string): Promise<BonusRound | null> {
  const { data, error } = await supabaseAdmin()
    .from("bonus_rounds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new GameError("internal", error.message, 500);
  return data;
}

async function refreshBonusPlay(pid: string, roundId: string): Promise<BonusPlay | null> {
  const { data, error } = await supabaseAdmin().rpc("bonus_refresh_play", {
    p_participant: pid,
    p_round: roundId,
    p_now: sqlNow(),
  });
  if (error) throw new GameError("internal", error.message, 500);
  return data?.[0] ?? null;
}

/** A bonus play still on the clock (it can cross midnight, like a normal play). */
async function findRunningBonusPlay(pid: string, now: Date): Promise<BonusPlay | null> {
  const { data, error } = await supabaseAdmin()
    .from("bonus_plays")
    .select("*")
    .eq("participant_id", pid)
    .eq("status", "playing")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new GameError("internal", error.message, 500);
  if (!data) return null;
  if (new Date(data.deadline_at).getTime() > now.getTime()) return data;
  await refreshBonusPlay(pid, data.round_id);
  return null;
}

/** Bonus round linked to the word of `date` (one per day at most). */
async function getRoundForDate(date: string): Promise<BonusRound | null> {
  const { data, error } = await supabaseAdmin()
    .from("bonus_rounds")
    .select("*")
    .eq("eligible_date", date)
    .order("opens_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  // Before the migration is applied the table does not exist: just hide the bonus.
  if (error) return null;
  return data;
}

function windowOf(round: BonusRound, now: Date): PublicBonus["window"] {
  const t = now.getTime();
  if (t < Date.parse(round.opens_at)) return "upcoming";
  if (t >= Date.parse(round.closes_at)) return "closed";
  return "open";
}

async function buildBonus(
  pid: string,
  now: Date,
  round: BonusRound,
  play: BonusPlay | null,
): Promise<PublicBonus | null> {
  const window = windowOf(round, now);
  if (window === "closed" && !play) return null;

  let result: PublicBonus["result"] = null;
  if (play && play.status !== "playing") {
    const winners = await getOfficialWinners();
    const status = titleStatus(pid, round.id, play.status === "won", winners);
    const w = winners.get(round.id);
    result = {
      isWinner: status.kind === "winner",
      winner: w ? { fullName: w.fullName, durationMs: w.durationMs } : null,
      titledDate: status.kind === "already" ? status.titleDate : null,
    };
  }

  return {
    id: round.id,
    window,
    opensAt: round.opens_at,
    closesAt: round.closes_at,
    category: round.category,
    mask: buildMask(round.word, play?.guessed_letters ?? []),
    timeLimitSeconds: round.time_limit_seconds,
    maxErrors: round.max_errors,
    play: play ? toPublicBonusPlay(play, round) : null,
    result,
  };
}

/**
 * Bonus shown in the game state:
 * - a bonus play still running always wins (so it can be finished, even after midnight);
 * - otherwise, the round of the word of the day, only once that word was finished.
 */
export async function getBonusForState(
  pid: string,
  now: Date,
  dayDate: string,
  dayFinished: boolean,
): Promise<PublicBonus | null> {
  let running: BonusPlay | null = null;
  try {
    running = await findRunningBonusPlay(pid, now);
  } catch {
    return null; // tables not created yet
  }
  if (running) {
    const round = await getRound(running.round_id);
    return round ? buildBonus(pid, now, round, running) : null;
  }
  if (!dayFinished) return null;

  const round = await getRoundForDate(dayDate);
  if (!round) return null;
  const play = await refreshBonusPlay(pid, round.id);
  return buildBonus(pid, now, round, play);
}

/** Round the player is acting on: their running bonus play, or the open round of `dayDate`. */
export async function resolveBonusRound(pid: string, now: Date, dayDate: string): Promise<string> {
  const running = await findRunningBonusPlay(pid, now);
  if (running) return running.round_id;
  const round = await getRoundForDate(dayDate);
  if (!round || windowOf(round, now) !== "open") {
    const existing = round ? await refreshBonusPlay(pid, round.id) : null;
    if (existing) return round!.id; // already played: the RPC just returns it
    throw new GameError("bonus_closed", "La ronda bonus no está abierta en este momento.", 409);
  }
  return round.id;
}

function mapBonusError(message: string): GameError {
  if (message.includes("bonus_closed") || message.includes("bonus_not_found")) {
    return new GameError("bonus_closed", "La ronda bonus no está abierta en este momento.", 409);
  }
  if (message.includes("bonus_not_eligible")) {
    return new GameError(
      "bonus_not_eligible",
      "La ronda bonus es solo para quienes ya jugaron la palabra de hoy.",
      403,
    );
  }
  return new GameError("internal", "No pudimos procesar tu jugada. Intenta de nuevo.", 500);
}

export async function bonusStart(pid: string, roundId: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("bonus_start_play", {
    p_participant: pid,
    p_round: roundId,
    p_now: sqlNow(),
  });
  if (error) throw mapBonusError(error.message);
}

export async function bonusGuess(pid: string, roundId: string, letter: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("bonus_apply_guess", {
    p_participant: pid,
    p_round: roundId,
    p_letter: letter,
    p_now: sqlNow(),
  });
  if (error) throw mapBonusError(error.message);
}
