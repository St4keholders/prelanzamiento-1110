/**
 * Public game types shared by the server and the browser.
 * NOTHING here may contain the secret word: only the mask and already-played letters.
 */
import type { Mask } from "@/lib/word";

export type PlayStatus = "playing" | "won" | "lost";
export type LostReason = "errors" | "timeout";

export interface PublicPlayer {
  fullName: string;
  maskedEmail: string;
}

export interface PublicPlay {
  gameDate: string;
  status: PlayStatus;
  lostReason: LostReason | null;
  guessedLetters: string[];
  correctLetters: string[];
  wrongLetters: string[];
  livesLeft: number;
  startedAt: string;
  deadlineAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  winCode: string | null;
}

export interface PublicDay {
  number: number;
  date: string;
  category: string;
  mask: Mask;
  timeLimitSeconds: number;
  maxErrors: number;
  isLastDay: boolean;
}

/** Per-day result for the 11-dot streak row. */
export type DayResult = "won" | "lost" | "missed" | "playing" | "future";

export interface DayWinner {
  fullName: string;
  durationMs: number | null;
}

/** Only present once the player's play of the day is finished (won or lost). */
export interface PlayResult {
  days: { date: string; result: DayResult }[];
  /** Words guessed so far ("Voy X de 11 palabras"). */
  wonCount: number;
  /** Día 1 (4 nov): everyone who guesses is a winner (+25 nueces bonus). */
  multiWinnerDay: boolean;
  /** Official winner of this day (null on Día 1 or if nobody has won yet). */
  dayWinner: DayWinner | null;
  /** True when THIS player is a winner of this day (on Día 1: whoever guessed). */
  isDayWinner: boolean;
  /** Date of the title this player already holds from an earlier day (blocks new titles). */
  titledDate: string | null;
}

/** Extra word ("ronda bonus") for people who already finished the word of the day. */
export interface PublicBonus {
  id: string;
  /** upcoming: not open yet · open: can be played · closed: window over. */
  window: "upcoming" | "open" | "closed";
  opensAt: string;
  closesAt: string;
  category: string;
  mask: Mask;
  timeLimitSeconds: number;
  maxErrors: number;
  play: PublicPlay | null;
  /** Only when `play` is finished. */
  result: {
    isWinner: boolean;
    winner: DayWinner | null;
    /** Earlier title this player already holds (blocks the bonus title). */
    titledDate: string | null;
  } | null;
}

interface BaseState {
  serverNow: string;
  player: PublicPlayer;
}

export type GameState =
  | (BaseState & { phase: "before"; startsAt: string })
  | (BaseState & { phase: "ended" })
  | (BaseState & { phase: "active"; noWord: true; nextWordAt: string })
  | (BaseState & {
      phase: "active";
      noWord?: false;
      day: PublicDay;
      play: PublicPlay | null;
      /** false when the play shown started yesterday and crossed midnight. */
      isToday: boolean;
      nextWordAt: string;
      /** Streak + first winner, only when `play` is finished. */
      result: PlayResult | null;
      /** Bonus round, only for players who finished the word of the day (or are playing it). */
      bonus: PublicBonus | null;
    });

export interface ApiError {
  error: string;
  message: string;
}
