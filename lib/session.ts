import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const PLAYER_COOKIE = "ahd_session";
export const ADMIN_COOKIE = "ahd_admin";
const PLAYER_EXPIRES = new Date("2026-11-30T23:59:59-05:00");
const ADMIN_TTL_SECONDS = 12 * 60 * 60;

function key() {
  return new TextEncoder().encode(env.sessionSecret);
}

function cookieBase() {
  return { httpOnly: true, secure: env.isProduction, sameSite: "lax" as const, path: "/" };
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export async function createPlayerSession(participantId: string): Promise<void> {
  const token = await new SignJWT({ pid: participantId, role: "player" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(PLAYER_EXPIRES.getTime() / 1000))
    .sign(key());
  (await cookies()).set(PLAYER_COOKIE, token, { ...cookieBase(), expires: PLAYER_EXPIRES });
}

export async function getPlayerId(): Promise<string | null> {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.role === "player" && typeof payload.pid === "string" ? payload.pid : null;
  } catch {
    return null;
  }
}

export async function clearPlayerSession(): Promise<void> {
  (await cookies()).delete(PLAYER_COOKIE);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_TTL_SECONDS}s`)
    .sign(key());
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase(), maxAge: ADMIN_TTL_SECONDS });
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
