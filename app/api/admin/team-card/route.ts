import { formatEventDate } from "@/lib/event-format";
import { handleError, jsonError } from "@/lib/http";
import { isAdmin } from "@/lib/session";
import { renderTeamCard } from "@/lib/share-image-post";
import { getPublicEvent, getTeamByCode } from "@/lib/teams";

/** PNG 1080x1920 of any team (same card players download), for the 1110 team. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return jsonError("unauthorized", "Inicia sesión como administrador.", 401);
  const code = new URL(request.url).searchParams.get("code") ?? "";
  try {
    const [team, event] = await Promise.all([getTeamByCode(code, null), getPublicEvent()]);
    if (!team) return jsonError("not_found", "Ese team ya no existe.", 404);
    const res = await renderTeamCard(team, `${event.title} · ${formatEventDate(event.startsAt)}`);
    res.headers.set("Content-Disposition", `attachment; filename="mesa-${team.tableNumber}.png"`);
    return res;
  } catch (err) {
    return handleError(err);
  }
}
