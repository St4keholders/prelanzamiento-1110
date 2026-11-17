import { z } from "zod";
import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { isAdmin } from "@/lib/session";
import {
  adminAddMember,
  adminCancelInvite,
  adminCreateStaffTeam,
  adminMakeCaptain,
  adminMergeTeams,
  adminMoveMember,
  adminReleaseTeam,
  adminRemoveMember,
  adminUpdateEvent,
} from "@/lib/teams-admin";
import { emailSchema, firstIssue } from "@/lib/validation";
import { COLOR_KEYS, FLAG_KEYS } from "@/lib/teams-catalog";

const id = z.uuid({ message: "Dato no válido." });
const iso = z.iso.datetime({ offset: true, message: "Fecha no válida." });

const schemas = {
  release: z.object({ teamId: id }),
  remove: z.object({ participantId: id }),
  captain: z.object({ participantId: id }),
  move: z.object({ participantId: id, targetTeamId: id }),
  merge: z.object({ sourceId: id, targetId: id }),
  "cancel-invite": z.object({ inviteId: id }),
  "add-member": z.object({ teamId: id, email: emailSchema }),
  "staff-create": z.object({
    name: z.string().trim().min(2, { message: "El nombre debe tener entre 2 y 30 letras." }).max(30, { message: "El nombre debe tener entre 2 y 30 letras." }),
    flag: z.enum(FLAG_KEYS),
    color: z.enum(COLOR_KEYS),
    motto: z.string().trim().max(60).default(""),
    captainEmail: emailSchema,
  }),
  event: z.object({
    title: z.string().trim().min(2).max(80),
    startsAt: iso,
    placeName: z.string().trim().max(120).default(""),
    address: z.string().trim().max(200).default(""),
    mapsUrl: z.string().trim().max(300).default(""),
    reservationsOpenAt: iso,
    reservationsCloseAt: iso,
    tableCount: z.coerce.number().int().min(1).max(50),
    seatsPerTable: z.coerce.number().int().min(1).max(20),
  }),
} as const;

type Action = keyof typeof schemas;

export async function POST(request: Request, ctx: { params: Promise<{ action: string }> }) {
  if (!(await isAdmin())) return jsonError("unauthorized", "Inicia sesión como administrador.", 401);
  const { action } = await ctx.params;
  if (!(action in schemas)) return jsonError("not_found", "Acción no válida.", 404);

  const parsed = schemas[action as Action].safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);
  const d = parsed.data as unknown as Record<string, string>;

  try {
    switch (action as Action) {
      case "release":
        await adminReleaseTeam(d.teamId);
        break;
      case "remove":
        await adminRemoveMember(d.participantId);
        break;
      case "captain":
        await adminMakeCaptain(d.participantId);
        break;
      case "move":
        await adminMoveMember(d.participantId, d.targetTeamId);
        break;
      case "merge":
        await adminMergeTeams(d.sourceId, d.targetId);
        break;
      case "cancel-invite":
        await adminCancelInvite(d.inviteId);
        break;
      case "add-member":
        await adminAddMember(d.teamId, d.email);
        break;
      case "staff-create":
        await adminCreateStaffTeam(parsed.data as z.infer<(typeof schemas)["staff-create"]>);
        break;
      case "event":
        await adminUpdateEvent(parsed.data as z.infer<(typeof schemas)["event"]>);
        break;
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
