import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { getPlayerId } from "@/lib/session";
import {
  acceptInvite,
  declineInvite,
  getMesaState,
  leaveTeam,
  saveContact,
  setSquirrel,
  takeSeat,
  updateTeam,
} from "@/lib/teams";
import {
  contactSchema,
  firstIssue,
  teamAcceptSchema,
  teamMoveSchema,
  teamSeatSchema,
  teamSquirrelSchema,
  teamUpdateSchema,
} from "@/lib/validation";
import type { z } from "zod";

type Handler = (pid: string, body: unknown) => Promise<void | Response>;

function parse<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> | Response {
  const r = schema.safeParse(body);
  return r.success ? r.data : jsonError("invalid", firstIssue(r.error), 400);
}

const ACTIONS: Record<string, Handler> = {
  /** Entra a una mesa (desde la lista o con el enlace de un amigo). */
  async seat(pid, body) {
    const d = parse(teamSeatSchema, body);
    if (d instanceof Response) return d;
    await saveContact(pid, d);
    await takeSeat(pid, d.tableNumber, d.squirrel);
  },
  /** Se cambia de mesa conservando sus datos y su ardilla. */
  async move(pid, body) {
    const d = parse(teamMoveSchema, body);
    if (d instanceof Response) return d;
    await takeSeat(pid, d.tableNumber, null);
  },
  async accept(pid, body) {
    const d = parse(teamAcceptSchema, body);
    if (d instanceof Response) return d;
    await saveContact(pid, d);
    await acceptInvite(pid, d.squirrel);
  },
  async profile(pid, body) {
    const d = parse(contactSchema, body);
    if (d instanceof Response) return d;
    await saveContact(pid, d);
  },
  async decline(pid) {
    await declineInvite(pid);
  },
  async leave(pid) {
    await leaveTeam(pid);
  },
  async update(pid, body) {
    const d = parse(teamUpdateSchema, body);
    if (d instanceof Response) return d;
    await updateTeam(pid, d);
  },
  async squirrel(pid, body) {
    const d = parse(teamSquirrelSchema, body);
    if (d instanceof Response) return d;
    await setSquirrel(pid, d.squirrel);
  },
};

/** POST /api/teams/{action} → returns the updated MesaState. */
export async function POST(request: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const handler = ACTIONS[action];
  if (!handler) return jsonError("not_found", "Acción no válida.", 404);

  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);

  try {
    const early = await handler(pid, await readJson(request));
    if (early instanceof Response) return early;
    return jsonOk(await getMesaState(pid));
  } catch (err) {
    return handleError(err);
  }
}

/** GET /api/teams/state → MesaState of the logged-in player. */
export async function GET(_request: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action !== "state") return jsonError("not_found", "Acción no válida.", 404);
  const pid = await getPlayerId();
  if (!pid) return jsonError("unauthorized", "Inicia sesión con tu correo.", 401);
  try {
    return jsonOk(await getMesaState(pid));
  } catch (err) {
    return handleError(err);
  }
}
