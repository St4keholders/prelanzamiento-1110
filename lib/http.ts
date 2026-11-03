import "server-only";
import { GameError } from "@/lib/game";
import type { ApiError } from "@/lib/game-types";

export function jsonError(error: string, message: string, status: number) {
  return Response.json({ error, message } satisfies ApiError, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function handleError(err: unknown) {
  if (err instanceof GameError) return jsonError(err.code, err.message, err.status);
  console.error(err);
  return jsonError("internal", "Ocurrió un error inesperado. Intenta de nuevo.", 500);
}
