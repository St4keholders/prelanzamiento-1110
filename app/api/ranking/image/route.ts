import { jsonError } from "@/lib/http";
import { getMyRanking } from "@/lib/ranking";
import { getPlayerId } from "@/lib/session";
import { renderRankingImage } from "@/lib/share-image-post";

/** PNG 1080x1920 "Quedé #N de M" for the logged-in player. */
export async function GET() {
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);
  const me = await getMyRanking(pid);
  if (!me) return jsonError("not_ranked", "No apareces en el ranking.", 404);
  return renderRankingImage(me);
}
