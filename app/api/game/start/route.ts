import { startGame } from "@/lib/game";
import { handleError, jsonError, jsonOk } from "@/lib/http";
import { getPlayerId } from "@/lib/session";

export async function POST() {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);
  try {
    return jsonOk(await startGame(pid));
  } catch (err) {
    return handleError(err);
  }
}
