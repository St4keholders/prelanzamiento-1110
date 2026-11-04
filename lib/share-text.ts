/**
 * Texts for the shareable result image and the waiting screen.
 * Pure functions (no server/browser APIs) so they can be unit tested.
 */
import type { LostReason } from "@/lib/game-types";
import { TOTAL_DAYS } from "@/lib/time";

export type ShareVariant = "winner" | "won" | "lost-errors" | "lost-timeout";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function shareVariant(
  status: "won" | "lost",
  lostReason: LostReason | null,
  isDayWinner: boolean,
): ShareVariant {
  if (status === "won") return isDayWinner ? "winner" : "won";
  return lostReason === "timeout" ? "lost-timeout" : "lost-errors";
}

/** "DÍA 1 DE 11 · 4 NOV 2026" */
export function dayPillText(dayNumber: number, date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `DÍA ${dayNumber} DE ${TOTAL_DAYS} · ${d} ${MONTHS[m - 1]} ${y}`;
}

/** On Día 1 (everyone who guesses wins) the title carries the day number. */
export function shareTitle(variant: ShareVariant, multiWinnerDay = false, dayNumber = 1): string {
  switch (variant) {
    case "winner":
      return multiWinnerDay ? `¡Gané el día ${dayNumber}!` : "¡Gané el día!";
    case "won":
      return "¡Lo logré!";
    case "lost-timeout":
      return "Se me acabó el tiempo";
    case "lost-errors":
      return "Hoy no adiviné";
  }
}

/** "Me quedó 1 vida" / "Me quedaron 2 vidas" (after winning). */
export function livesLeftText(lives: number): string {
  return lives === 1 ? "Me quedó 1 vida" : `Me quedaron ${lives} vidas`;
}

/** "0 vidas" (lost by errors) / "Me quedaba 1 vida" (lost by timeout). */
export function lostLivesText(variant: ShareVariant, lives: number): string {
  if (variant === "lost-errors") return "0 vidas";
  return lives === 1 ? "Me quedaba 1 vida" : `Me quedaban ${lives} vidas`;
}

export function revengeText(isLastDay: boolean): string {
  return isLastDay ? "Fue el último día del reto." : "Pero mañana vuelvo por la revancha.";
}

/** "Voy 3 de 11 palabras" (words guessed). */
export function progressText(wonCount: number): string {
  return `Voy ${wonCount} de ${TOTAL_DAYS} palabras`;
}

/** Badge above the title of a day winner's image. */
export function winnerBadge(multiWinnerDay: boolean): string {
  return multiWinnerDay ? "+25 NUECES EN LA APP 1110" : "GANADOR DEL DÍA";
}

export const NUECES_BONUS_TEXT =
  "Bono de 25 nueces en la app 1110, que sale el 11 de noviembre.";
