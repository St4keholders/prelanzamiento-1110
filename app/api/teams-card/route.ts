import { formatEventDate } from "@/lib/event-format";
import { handleError, jsonError } from "@/lib/http";
import { getPlayerId } from "@/lib/session";
import { renderTeamCard } from "@/lib/share-image-post";
import { getMesaState } from "@/lib/teams";

/** PNG 1080x1920 of the player's team (to share and recruit). */
export async function GET() {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);
  try {
    const mesa = await getMesaState(pid);
    if (!mesa.team) return jsonError("not_in_team", "No perteneces a ningún team.", 404);
    return await renderTeamCard(mesa.team, `${mesa.event.title} · ${formatEventDate(mesa.event.startsAt)}`);
  } catch (err) {
    return handleError(err);
  }
}
