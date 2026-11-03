import { jsonOk } from "@/lib/http";
import { clearPlayerSession } from "@/lib/session";

export async function POST() {
  await clearPlayerSession();
  return jsonOk({ ok: true });
}
