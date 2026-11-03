import { getGameState } from "@/lib/game";
import { handleError, jsonError, jsonOk } from "@/lib/http";
import { getPlayerId } from "@/lib/session";

export async function GET() {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);
  try {
    return jsonOk(await getGameState(pid));
  } catch (err) {
    return handleError(err);
  }
}
