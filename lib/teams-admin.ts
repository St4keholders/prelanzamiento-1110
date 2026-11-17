import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sheet } from "@/lib/export";
import { formatMs } from "@/lib/event-format";
import { getRanking } from "@/lib/ranking";
import { supabaseAdmin } from "@/lib/supabase";
import { TeamError } from "@/lib/team-error";
import { colorHex, flagName, squirrelName } from "@/lib/teams-catalog";
import { getEventRow } from "@/lib/teams";

function db(): SupabaseClient {
  return supabaseAdmin() as unknown as SupabaseClient;
}

function bad(message: string): TeamError {
  return new TeamError("invalid", message, 400);
}

export interface AdminMember {
  participantId: string;
  name: string;
  email: string;
  phone: string;
  squirrel: string;
  isCaptain: boolean;
  joinedAt: string;
}

export interface AdminTeam {
  id: string;
  tableNumber: number;
  name: string;
  flag: string;
  color: string;
  colorHex: string;
  motto: string;
  joinCode: string;
  createdAt: string;
  members: AdminMember[];
  invites: { id: string; name: string; email: string; invitedAt: string }[];
  confirmed: boolean;
}

export interface AdminMesas {
  event: Awaited<ReturnType<typeof getEventRow>>;
  teams: AdminTeam[];
}

export async function getAdminMesas(): Promise<AdminMesas> {
  const [event, teams, members, invites] = await Promise.all([
    getEventRow(),
    db().from("teams").select("*").order("table_number"),
    db().from("team_members").select("*").order("joined_at"),
    db().from("team_invites").select("*").order("invited_at"),
  ]);
  for (const r of [teams, members, invites]) if (r.error) throw new Error(r.error.message);

  const ids = [...new Set((members.data ?? []).map((m: { participant_id: string }) => m.participant_id))];
  const people = new Map<string, { full_name: string; email: string; phone: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db()
      .from("participants")
      .select("id, full_name, email, phone")
      .in("id", ids.slice(i, i + 200));
    for (const p of data ?? []) people.set(p.id, p);
  }

  return {
    event,
    teams: (teams.data ?? []).map((t) => {
      const ms = (members.data ?? []).filter((m) => m.team_id === t.id);
      return {
        id: t.id,
        tableNumber: t.table_number,
        name: t.name,
        flag: t.flag,
        color: t.color,
        colorHex: colorHex(t.color),
        motto: t.motto,
        joinCode: t.join_code,
        createdAt: t.created_at,
        members: ms.map((m) => {
          const p = people.get(m.participant_id);
          return {
            participantId: m.participant_id,
            name: p?.full_name ?? "",
            email: p?.email ?? "",
            phone: p?.phone ?? "",
            squirrel: m.squirrel,
            isCaptain: m.participant_id === t.captain_id,
            joinedAt: m.joined_at,
          };
        }),
        invites: (invites.data ?? [])
          .filter((i) => i.team_id === t.id)
          .map((i) => ({ id: i.id, name: i.full_name, email: i.email, invitedAt: i.invited_at })),
        confirmed: ms.length >= event.seats_per_table,
      };
    }),
  };
}

async function teamRow(id: string) {
  const { data } = await db().from("teams").select("*").eq("id", id).maybeSingle();
  if (!data) throw bad("Ese team ya no existe.");
  return data as { id: string; captain_id: string; table_number: number };
}

async function seatsUsed(teamId: string): Promise<number> {
  const [m, i] = await Promise.all([
    db().from("team_members").select("id", { count: "exact", head: true }).eq("team_id", teamId),
    db().from("team_invites").select("id", { count: "exact", head: true }).eq("team_id", teamId),
  ]);
  return (m.count ?? 0) + (i.count ?? 0);
}

/** After someone leaves `teamId`: pass captaincy to the oldest member, or free the table. */
async function fixCaptain(teamId: string): Promise<void> {
  const team = await teamRow(teamId);
  const { data: members } = await db()
    .from("team_members")
    .select("participant_id")
    .eq("team_id", teamId)
    .order("joined_at");
  const list = (members ?? []).map((m) => m.participant_id as string);
  if (list.length === 0) {
    await db().from("teams").delete().eq("id", teamId);
    return;
  }
  if (!list.includes(team.captain_id)) {
    await db().from("teams").update({ captain_id: list[0] }).eq("id", teamId);
  }
}

// ---------------------------------------------------------------------------
// Acciones manuales del equipo 1110 (sin ventana de reservas: el admin siempre puede)
// ---------------------------------------------------------------------------

export async function adminReleaseTeam(teamId: string): Promise<void> {
  const { error } = await db().from("teams").delete().eq("id", teamId);
  if (error) throw new Error(error.message);
}

export async function adminRemoveMember(participantId: string): Promise<void> {
  const { data } = await db()
    .from("team_members")
    .delete()
    .eq("participant_id", participantId)
    .select("team_id");
  const teamId = data?.[0]?.team_id as string | undefined;
  if (!teamId) throw bad("Esa persona ya no está en ningún team.");
  await fixCaptain(teamId);
}

export async function adminMakeCaptain(participantId: string): Promise<void> {
  const { data } = await db()
    .from("team_members")
    .select("team_id")
    .eq("participant_id", participantId)
    .maybeSingle();
  if (!data) throw bad("Esa persona no está en ningún team.");
  await db().from("teams").update({ captain_id: participantId }).eq("id", data.team_id);
}

export async function adminMoveMember(participantId: string, targetTeamId: string): Promise<void> {
  const ev = await getEventRow();
  const { data: m } = await db()
    .from("team_members")
    .select("team_id")
    .eq("participant_id", participantId)
    .maybeSingle();
  if (!m) throw bad("Esa persona no está en ningún team.");
  if (m.team_id === targetTeamId) return;
  await teamRow(targetTeamId);
  if ((await seatsUsed(targetTeamId)) >= ev.seats_per_table) {
    throw bad("La mesa de destino ya no tiene puestos libres.");
  }
  await db()
    .from("team_members")
    .update({ team_id: targetTeamId })
    .eq("participant_id", participantId);
  await fixCaptain(m.team_id);
}

/** Moves every member and invite of `sourceId` into `targetId` and frees the source table. */
export async function adminMergeTeams(sourceId: string, targetId: string): Promise<void> {
  if (sourceId === targetId) throw bad("Escoge otra mesa para fusionar.");
  const ev = await getEventRow();
  await Promise.all([teamRow(sourceId), teamRow(targetId)]);
  const total = (await seatsUsed(sourceId)) + (await seatsUsed(targetId));
  if (total > ev.seats_per_table) {
    throw bad(`Juntos suman ${total} puestos y la mesa es de ${ev.seats_per_table}.`);
  }
  await db().from("team_members").update({ team_id: targetId }).eq("team_id", sourceId);
  await db().from("team_invites").update({ team_id: targetId }).eq("team_id", sourceId);
  await db().from("teams").delete().eq("id", sourceId);
}

export async function adminCancelInvite(inviteId: string): Promise<void> {
  await db().from("team_invites").delete().eq("id", inviteId);
}

export async function adminUpdateEvent(input: {
  title: string;
  startsAt: string;
  placeName: string;
  address: string;
  mapsUrl: string;
  reservationsOpenAt: string;
  reservationsCloseAt: string;
  tableCount: number;
  seatsPerTable: number;
}): Promise<void> {
  if (Date.parse(input.reservationsCloseAt) <= Date.parse(input.reservationsOpenAt)) {
    throw bad("El cierre de reservas debe ser después de la apertura.");
  }
  const { data: maxRow } = await db()
    .from("teams")
    .select("table_number")
    .order("table_number", { ascending: false })
    .limit(1);
  const maxUsed = (maxRow?.[0]?.table_number as number | undefined) ?? 0;
  if (input.tableCount < maxUsed) {
    throw bad(`La mesa ${maxUsed} está ocupada: no puedes dejar menos de ${maxUsed} mesas.`);
  }
  const { error } = await db()
    .from("event_settings")
    .update({
      title: input.title,
      starts_at: input.startsAt,
      place_name: input.placeName,
      address: input.address,
      maps_url: input.mapsUrl,
      reservations_open_at: input.reservationsOpenAt,
      reservations_close_at: input.reservationsCloseAt,
      table_count: input.tableCount,
      seats_per_table: input.seatsPerTable,
    })
    .eq("id", 1);
  if (error) throw bad(error.message);
}

// ---------------------------------------------------------------------------
// Exportes
// ---------------------------------------------------------------------------

export async function mesasSheet(): Promise<Sheet> {
  const { event, teams } = await getAdminMesas();
  const rows: (string | number)[][] = [];
  for (const t of teams) {
    const status = t.confirmed ? "Confirmada" : "Incompleta";
    for (const m of t.members) {
      rows.push([
        t.tableNumber, t.name, status, flagName(t.flag), t.motto,
        m.isCaptain ? "Capitán" : "Integrante", m.name, m.email, m.phone, squirrelName(m.squirrel), "Dentro",
      ]);
    }
    for (const i of t.invites) {
      rows.push([t.tableNumber, t.name, status, flagName(t.flag), t.motto, "Invitado", i.name, i.email, "", "", "Pendiente"]);
    }
  }
  return {
    name: `Mesas (${teams.length} de ${event.table_count})`,
    columns: ["Mesa", "Team", "Estado mesa", "Bandera", "Lema", "Rol", "Nombre", "Correo", "Celular", "Ardilla", "Estado"],
    rows,
  };
}

export async function rankingSheet(): Promise<Sheet> {
  const rows = await getRanking();
  const ids = rows.map((r) => r.participantId);
  const people = new Map<string, { email: string; phone: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db().from("participants").select("id, email, phone").in("id", ids.slice(i, i + 200));
    for (const p of data ?? []) people.set(p.id, p);
  }
  return {
    name: "Ranking",
    columns: ["Puesto", "Nombre", "Correo", "Celular", "Palabras adivinadas", "Palabras jugadas", "Tiempo total", "Mejor tiempo", "Vidas perdidas"],
    rows: rows.map((r) => [
      r.position, r.name, people.get(r.participantId)?.email ?? "", people.get(r.participantId)?.phone ?? "",
      r.won, r.played, formatMs(r.totalMs), formatMs(r.bestMs), r.livesLost,
    ]),
  };
}
