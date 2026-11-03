import { guessLetter } from "@/lib/game";
import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { getPlayerId } from "@/lib/session";
import { firstIssue, guessSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);

  const parsed = guessSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);

  try {
    return jsonOk(await guessLetter(pid, parsed.data.letter));
  } catch (err) {
    return handleError(err);
  }
}
