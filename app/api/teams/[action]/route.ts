import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { getPlayerId } from "@/lib/session";
import {
  acceptInvite,
  cancelInvite,
  createTeam,
  declineInvite,
  getMesaState,
  inviteToTeam,
  joinTeam,
  leaveTeam,
  removeMember,
  setSquirrel,
  updateTeam,
} from "@/lib/teams";
import {
  firstIssue,
  teamCreateSchema,
  teamIdSchema,
  teamInviteSchema,
  teamJoinSchema,
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
  async create(pid, body) {
    const d = parse(teamCreateSchema, body);
    if (d instanceof Response) return d;
    await createTeam(pid, d);
  },
  async join(pid, body) {
    const d = parse(teamJoinSchema, body);
    if (d instanceof Response) return d;
    await joinTeam(pid, d.code, d.squirrel);
  },
  async accept(pid, body) {
    const d = parse(teamSquirrelSchema, body);
    if (d instanceof Response) return d;
    await acceptInvite(pid, d.squirrel);
  },
  async decline(pid) {
    await declineInvite(pid);
  },
  async invite(pid, body) {
    const d = parse(teamInviteSchema, body);
    if (d instanceof Response) return d;
    await inviteToTeam(pid, d.email, d.fullName);
  },
  async "cancel-invite"(pid, body) {
    const d = parse(teamIdSchema, body);
    if (d instanceof Response) return d;
    await cancelInvite(pid, d.id);
  },
  async remove(pid, body) {
    const d = parse(teamIdSchema, body);
    if (d instanceof Response) return d;
    await removeMember(pid, d.id);
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
