import { GameError, getGameState } from "@/lib/game";
import { handleError, jsonError } from "@/lib/http";
import { getPlayerId } from "@/lib/session";
import { renderShareImage } from "@/lib/share-image";
import { bonusShareTexts, shareVariant } from "@/lib/share-text";

/**
 * PNG (1080x1920) of the player's finished play, to share on Instagram & co.
 * Never contains the secret word.
 */
export async function GET(request: Request) {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Sesión no válida.", 401);

  try {
    const state = await getGameState(pid);
    const wantsBonus = new URL(request.url).searchParams.get("bonus") === "1";

    if (wantsBonus) {
      const bonus = state.phase === "active" && !state.noWord ? state.bonus : null;
      if (!bonus?.play || bonus.play.status === "playing" || !bonus.result) {
        return jsonError("not_finished", "Aún no has terminado la ronda bonus.", 404);
      }
      const { play, result } = bonus;
      const streak = state.phase === "active" && !state.noWord ? state.result : null;
      return await renderShareImage({
        variant: shareVariant(play.status === "won" ? "won" : "lost", play.lostReason, result.isWinner),
        multiWinnerDay: false,
        fullName: state.player.fullName,
        dayNumber: 0,
        date: play.gameDate,
        durationMs: play.durationMs,
        livesLeft: play.livesLeft,
        maxLives: bonus.maxErrors,
        isLastDay: false,
        wonCount: streak?.wonCount ?? 0,
        days: streak?.days.map((d) => d.result) ?? [],
        bonus: bonusShareTexts(play.gameDate),
      });
    }

    if (
      state.phase !== "active" ||
      state.noWord ||
      !state.play ||
      state.play.status === "playing" ||
      !state.result
    ) {
      return jsonError("not_finished", "Aún no has terminado tu partida de hoy.", 404);
    }

    const { day, play, result, player } = state;
    return await renderShareImage({
      variant: shareVariant(
        play.status === "won" ? "won" : "lost",
        play.lostReason,
        result.isDayWinner,
      ),
      multiWinnerDay: result.multiWinnerDay,
      fullName: player.fullName,
      dayNumber: day.number,
      date: day.date,
      durationMs: play.durationMs,
      livesLeft: play.livesLeft,
      maxLives: day.maxErrors,
      isLastDay: day.isLastDay,
      wonCount: result.wonCount,
      days: result.days.map((d) => d.result),
    });
  } catch (err) {
    if (err instanceof GameError) return handleError(err);
    console.error(err);
    return jsonError("internal", "No pudimos generar la imagen.", 500);
  }
}
