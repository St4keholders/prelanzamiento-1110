import { jsonOk } from "@/lib/http";
import { clearAdminSession } from "@/lib/session";

export async function POST() {
  await clearAdminSession();
  return jsonOk({ ok: true });
}
