import { saveDailyWord } from "@/lib/admin";
import { serverNow } from "@/lib/env";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { formatStart, isStartEditable, startAt, windowFor } from "@/lib/schedule";
import { clearScheduleCache, getSchedule } from "@/lib/schedule-server";
import { isAdmin } from "@/lib/session";
import { formatLongDate, isGameDate } from "@/lib/time";
import { dailyWordSchema, firstIssue } from "@/lib/validation";

/**
 * Create or edit the word of a day (text, category, time and start time).
 * Only allowed before that word starts (hora Colombia); the new start must be in the future.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return jsonError("unauthorized", "Inicia sesión como administrador.", 401);

  const parsed = dailyWordSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);

  const { date, word, category, timeLimitSeconds, startTime } = parsed.data;
  if (!isGameDate(date)) {
    return jsonError("invalid", "La fecha debe estar entre el 4 y el 14 de noviembre.", 400);
  }

  const now = serverNow();
  const current = windowFor(await getSchedule(), date);
  if (!current || !isStartEditable(current.startsAt, now)) {
    return jsonError(
      "locked",
      `La palabra del ${formatLongDate(date)} ya no se puede cambiar: ya salió.`,
      403,
    );
  }

  const newStart = startAt(date, startTime);
  if (!isStartEditable(newStart, now)) {
    return jsonError(
      "invalid",
      `La hora de inicio (${formatStart(newStart)}) ya pasó. Elige una hora futura.`,
      400,
    );
  }

  try {
    const saved = await saveDailyWord({
      game_date: date,
      word,
      category,
      time_limit_seconds: timeLimitSeconds,
      starts_at: newStart.toISOString(),
    });
    clearScheduleCache();
    return jsonOk({ ok: true, word: saved });
  } catch (err) {
    console.error(err);
    return jsonError("internal", "No se pudo guardar la palabra. Intenta de nuevo.", 500);
  }
}
