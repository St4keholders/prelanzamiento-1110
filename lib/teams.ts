import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverNow } from "@/lib/env";
import { recordConsent } from "@/lib/consent";
import { supabaseAdmin } from "@/lib/supabase";
import { tableInfo } from "@/lib/teams-catalog";
import { TeamError, teamError, teamErrorFrom } from "@/lib/team-error";
import type {
  MesaState,
  PendingInvite,
  PublicEvent,
  PublicTeam,
} from "@/lib/team-types";

// The teams tables are newer than the generated types: use an untyped client here.
function db(): SupabaseClient {
  return supabaseAdmin() as unknown as SupabaseClient;
}

function sqlNow(): string {
  return serverNow().toISOString();
}

interface EventRow {
  title: string;
  starts_at: string;
  place_name: string;
  address: string;
  maps_url: string;
  reservations_open_at: string;
  reservations_close_at: string;
  table_count: number;
  seats_per_table: number;
}

interface TeamRow {
  id: string;
  table_number: number;
  name: string;
  flag: string;
  color: string;
  motto: string;
  captain_id: string;
  join_code: string;
  created_at: string;
  staff?: boolean;
}

interface MemberRow {
  team_id: string;
  participant_id: string;
  squirrel: string;
  joined_at: string;
}

interface InviteRow {
  id: string;
  team_id: string;
  email: string;
  full_name: string;
  invited_at: string;
}

function fail(error: { message: string } | null): void {
  if (error) throw teamErrorFrom(error.message);
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export async function getEventRow(): Promise<EventRow> {
  const { data, error } = await db().from("event_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as EventRow;
}

export function isReservationOpen(ev: EventRow, now = serverNow()): boolean {
  const t = now.getTime();
  return t >= Date.parse(ev.reservations_open_at) && t < Date.parse(ev.reservations_close_at);
}

export async function getPublicEvent(): Promise<PublicEvent> {
  const [ev, taken] = await Promise.all([
    getEventRow(),
    db().from("teams").select("table_number").eq("staff", false),
  ]);
  const now = serverNow();
  return {
    title: ev.title,
    startsAt: ev.starts_at,
    placeName: ev.place_name,
    address: ev.address,
    mapsUrl: ev.maps_url,
    reservationsOpenAt: ev.reservations_open_at,
    reservationsCloseAt: ev.reservations_close_at,
    reservationsOpen: isReservationOpen(ev, now),
    tableCount: ev.table_count,
    seatsPerTable: ev.seats_per_table,
    tablesTaken: (taken.data ?? []).length,
    takenTables: (taken.data ?? []).map((t) => Number(t.table_number)).sort((a, b) => a - b),
    serverNow: now.toISOString(),
  };
}

async function namesOf(ids: string[]): Promise<Map<string, { full_name: string; email: string }>> {
  const map = new Map<string, { full_name: string; email: string }>();
  if (ids.length === 0) return map;
  const { data, error } = await db()
    .from("participants")
    .select("id, full_name, email")
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const p of data ?? []) map.set(p.id, p);
  return map;
}

/** Builds the public view of a team; `viewer` decides what private data is included. */
async function buildTeam(team: TeamRow, viewer: string | null, seatsTotal: number): Promise<PublicTeam> {
  const [members, invites] = await Promise.all([
    db().from("team_members").select("*").eq("team_id", team.id).order("joined_at"),
    db().from("team_invites").select("*").eq("team_id", team.id).order("invited_at"),
  ]);
  if (members.error) throw new Error(members.error.message);
  if (invites.error) throw new Error(invites.error.message);
  const mRows = (members.data ?? []) as MemberRow[];
  const iRows = (invites.data ?? []) as InviteRow[];
  const people = await namesOf(mRows.map((m) => m.participant_id));
  const isMember = viewer !== null && mRows.some((m) => m.participant_id === viewer);
  const isCaptain = viewer === team.captain_id;

  return {
    id: team.id,
    tableNumber: team.table_number,
    staff: team.staff === true,
    name: team.name,
    flag: team.flag,
    color: team.color,
    motto: team.motto,
    joinCode: isMember ? team.join_code : null,
    members: mRows.map((m) => ({
      participantId: m.participant_id,
      name: people.get(m.participant_id)?.full_name ?? "",
      squirrel: m.squirrel,
      isCaptain: m.participant_id === team.captain_id,
      isMe: m.participant_id === viewer,
    })),
    invites: iRows.map((i) => ({ id: i.id, name: i.full_name, email: isCaptain ? i.email : null })),
    seatsUsed: mRows.length + iRows.length,
    seatsTotal,
    confirmed: mRows.length >= seatsTotal,
    isCaptain,
  };
}

export async function getMesaState(pid: string): Promise<MesaState> {
  const [event, me, membership] = await Promise.all([
    getPublicEvent(),
    // "*" para no romper si la columna profession aún no existe.
    db().from("participants").select("*").eq("id", pid).maybeSingle(),
    db().from("team_members").select("team_id").eq("participant_id", pid).maybeSingle(),
  ]);
  if (me.error || !me.data) throw new TeamError("unauthorized", "Sesión no válida.", 401);

  let team: PublicTeam | null = null;
  if (membership.data) {
    const { data } = await db().from("teams").select("*").eq("id", membership.data.team_id).single();
    if (data) team = await buildTeam(data as TeamRow, pid, event.seatsPerTable);
  }

  let invite: PendingInvite | null = null;
  if (!team) {
    const inv = await db()
      .from("team_invites")
      .select("*")
      .eq("email", me.data.email)
      .maybeSingle();
    if (inv.data) {
      const i = inv.data as InviteRow;
      const { data: t } = await db().from("teams").select("*").eq("id", i.team_id).single();
      if (t) {
        const tr = t as TeamRow;
        const captain = await namesOf([tr.captain_id]);
        invite = {
          teamName: tr.name,
          tableNumber: tr.table_number,
          flag: tr.flag,
          color: tr.color,
          captainName: captain.get(tr.captain_id)?.full_name ?? "",
          invitedName: i.full_name,
        };
      }
    }
  }

  const p = me.data as {
    full_name: string;
    email: string;
    phone: string;
    profession?: string | null;
    data_consent_at?: string | null;
  };
  return {
    event,
    me: {
      fullName: p.full_name,
      email: p.email,
      phone: p.phone,
      profession: p.profession ?? null,
      dataConsent: Boolean(p.data_consent_at),
    },
    team,
    invite,
  };
}

/** Team shown on the join page (/m/CODE). Null if the code does not exist. */
export async function getTeamByCode(code: string, viewer: string | null): Promise<PublicTeam | null> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(clean)) return null;
  const [{ data }, ev] = await Promise.all([
    db().from("teams").select("*").eq("join_code", clean).maybeSingle(),
    getEventRow(),
  ]);
  if (!data) return null;
  return buildTeam(data as TeamRow, viewer, ev.seats_per_table);
}

// ---------------------------------------------------------------------------
// Acciones de jugador (las que tocan cupos van por funciones SQL atómicas)
// ---------------------------------------------------------------------------

/** Guarda nombre, teléfono y profesión del jugador (se piden al reservar o unirse). */
export async function saveContact(
  pid: string,
  c: { fullName: string; phone: string; profession: string },
): Promise<void> {
  const { error } = await db()
    .from("participants")
    .update({ full_name: c.fullName, phone: c.phone, profession: c.profession })
    .eq("id", pid);
  if (error) throw new Error(error.message);
  // Los esquemas exigen la casilla marcada antes de llegar aquí.
  await recordConsent(pid);
}

export async function createTeam(
  pid: string,
  input: { tableNumber: number; motto: string; squirrel: string },
): Promise<void> {
  const table = tableInfo(input.tableNumber);
  if (!table) throw teamError("table_invalid");
  const { error } = await db().rpc("team_create_at", {
    p_participant: pid,
    p_table: table.number,
    p_name: table.name,
    p_flag: table.flag,
    p_color: table.color,
    p_motto: input.motto,
    p_squirrel: input.squirrel,
    p_now: sqlNow(),
  });
  fail(error);
}

export async function joinTeam(pid: string, code: string, squirrel: string): Promise<void> {
  const { error } = await db().rpc("team_join", {
    p_participant: pid,
    p_code: code,
    p_squirrel: squirrel,
    p_now: sqlNow(),
  });
  fail(error);
}

export async function acceptInvite(pid: string, squirrel: string): Promise<void> {
  const { error } = await db().rpc("team_accept_invite", {
    p_participant: pid,
    p_squirrel: squirrel,
    p_now: sqlNow(),
  });
  fail(error);
}

export async function inviteToTeam(pid: string, email: string, fullName: string): Promise<void> {
  const { error } = await db().rpc("team_invite", {
    p_captain: pid,
    p_email: email,
    p_full_name: fullName,
    p_now: sqlNow(),
  });
  fail(error);
}

export async function leaveTeam(pid: string): Promise<string> {
  const { data, error } = await db().rpc("team_leave", { p_participant: pid, p_now: sqlNow() });
  fail(error);
  return String(data);
}

async function assertOpen(): Promise<void> {
  if (!isReservationOpen(await getEventRow())) throw teamError("reservations_closed");
}

async function captainTeam(pid: string): Promise<TeamRow> {
  const { data } = await db().from("teams").select("*").eq("captain_id", pid).maybeSingle();
  if (!data) throw teamError("not_captain");
  return data as TeamRow;
}

export async function declineInvite(pid: string): Promise<void> {
  const { data: me } = await db().from("participants").select("email").eq("id", pid).single();
  if (!me) throw teamError("no_invite");
  const { error } = await db().from("team_invites").delete().eq("email", me.email);
  fail(error);
}

export async function cancelInvite(pid: string, inviteId: string): Promise<void> {
  await assertOpen();
  const team = await captainTeam(pid);
  const { data, error } = await db()
    .from("team_invites")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", team.id)
    .select("id");
  fail(error);
  if (!data?.length) throw teamError("invite_not_found");
}

export async function removeMember(pid: string, memberId: string): Promise<void> {
  await assertOpen();
  const team = await captainTeam(pid);
  if (memberId === pid) throw new TeamError("invalid", "Para salirte usa “Salir del team”.", 400);
  const { data, error } = await db()
    .from("team_members")
    .delete()
    .eq("team_id", team.id)
    .eq("participant_id", memberId)
    .select("id");
  fail(error);
  if (!data?.length) throw teamError("not_member");
}

/** El capitán solo cambia el lema: nombre, bandera y color vienen de la mesa. */
export async function updateTeam(pid: string, input: { motto: string }): Promise<void> {
  await assertOpen();
  const team = await captainTeam(pid);
  const { error } = await db().from("teams").update(input).eq("id", team.id);
  fail(error);
}

export async function setSquirrel(pid: string, squirrel: string): Promise<void> {
  await assertOpen();
  const { data, error } = await db()
    .from("team_members")
    .update({ squirrel })
    .eq("participant_id", pid)
    .select("id");
  fail(error);
  if (!data?.length) throw teamError("not_in_team");
}
