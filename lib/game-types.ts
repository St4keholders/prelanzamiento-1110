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
    });

export interface ApiError {
  error: string;
  message: string;
}
