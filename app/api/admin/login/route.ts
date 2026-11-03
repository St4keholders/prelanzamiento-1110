import {
  checkAdminCredentials,
  clearLoginAttempts,
  clientIp,
  registerLoginAttempt,
} from "@/lib/admin";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { createAdminSession } from "@/lib/session";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const wait = registerLoginAttempt(ip);
  if (wait > 0) {
    return jsonError("rate_limited", `Demasiados intentos. Espera ${wait} s.`, 429);
  }

  const parsed = adminLoginSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", "Usuario o contraseña incorrectos.", 401);

  if (!checkAdminCredentials(parsed.data.user, parsed.data.password)) {
    return jsonError("invalid", "Usuario o contraseña incorrectos.", 401);
  }

  clearLoginAttempts(ip);
  await createAdminSession();
  return jsonOk({ ok: true });
}
