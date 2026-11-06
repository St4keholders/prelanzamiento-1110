import { saveDailyWord } from "@/lib/admin";
import { serverNow } from "@/lib/env";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/session";
import { formatLongDate, isGameDate, isWordEditable } from "@/lib/time";
import { dailyWordSchema, firstIssue } from "@/lib/validation";

/** Create or edit the word of a day. Only allowed before that day starts (hora Colombia). */
export async function POST(request: Request) {
  if (!(await isAdmin())) return jsonError("unauthorized", "Inicia sesión como administrador.", 401);

  const parsed = dailyWordSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);

  const { date, word, category, timeLimitSeconds } = parsed.data;
  if (!isGameDate(date)) {
    return jsonError("invalid", "La fecha debe estar entre el 4 y el 14 de noviembre.", 400);
  }
  if (!isWordEditable(date, serverNow())) {
    return jsonError(
      "locked",
      `La palabra del ${formatLongDate(date)} ya no se puede cambiar: ese día ya empezó.`,
      403,
    );
  }

  try {
    const saved = await saveDailyWord({
      game_date: date,
      word,
      category,
      time_limit_seconds: timeLimitSeconds,
    });
    return jsonOk({ ok: true, word: saved });
  } catch (err) {
    console.error(err);
    return jsonError("internal", "No se pudo guardar la palabra. Intenta de nuevo.", 500);
  }
}
