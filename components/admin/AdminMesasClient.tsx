"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Flag } from "@/components/teams/Art";
import { SquirrelFigure } from "@/components/teams/SquirrelFigure";
import type { AdminMesas, AdminTeam } from "@/lib/teams-admin";

/** ISO → "YYYY-MM-DDTHH:MM" in hora Colombia (UTC−5) for <input type="datetime-local">. */
function toLocal(iso: string): string {
  return new Date(Date.parse(iso) - 5 * 3600_000).toISOString().slice(0, 16);
}
function fromLocal(v: string): string {
  return new Date(`${v}:00-05:00`).toISOString();
}

const btn = "rounded-xl border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-warm disabled:opacity-50";
const danger = "rounded-xl bg-danger px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50";
const field = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink";

export function AdminMesasClient({ data }: { data: AdminMesas }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: string, body: unknown, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/teams/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) router.push("/admin/login");
        setMsg({ ok: false, text: json.message ?? "No se pudo completar." });
        return;
      }
      setMsg({ ok: true, text: okText });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Error de conexión." });
    } finally {
      setBusy(false);
    }
  }

  const { event, teams } = data;
  const byTable = new Map(teams.map((t) => [t.tableNumber, t]));
  const confirmed = teams.filter((t) => t.confirmed).length;
  const people = teams.reduce((n, t) => n + t.members.length, 0);
  const pending = teams.reduce((n, t) => n + t.invites.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark">Mesas y Teams</h1>
          <p className="text-sm text-muted">
            {teams.length} de {event.table_count} mesas apartadas · {confirmed} confirmadas ·{" "}
            {people} personas dentro · {pending} invitaciones pendientes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className={btn} href="/api/admin/export?type=mesas&format=xlsx">⬇ Mesas (.xlsx)</a>
          <a className={btn} href="/api/admin/export?type=ranking&format=xlsx">⬇ Ranking (.xlsx)</a>
        </div>
      </div>

      {msg && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={`rounded-2xl px-4 py-2 text-sm font-bold ${msg.ok ? "bg-sage text-primary" : "bg-danger/10 text-danger"}`}
        >
          {msg.text}
        </p>
      )}

      <EventForm data={data} busy={busy} act={act} />

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: event.table_count }, (_, i) => i + 1).map((n) => {
          const t = byTable.get(n);
          return t ? (
            <TeamCard key={n} team={t} teams={teams} seats={event.seats_per_table} busy={busy} act={act} />
          ) : (
            <div key={n} className="rounded-3xl border-2 border-dashed border-line bg-white/60 p-4">
              <p className="font-display text-sm font-extrabold text-muted">Mesa {n} · ⚪ Libre</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Act = (action: string, body: unknown, okText: string) => Promise<void>;

function TeamCard({
  team,
  teams,
  seats,
  busy,
  act,
}: {
  team: AdminTeam;
  teams: AdminTeam[];
  seats: number;
  busy: boolean;
  act: Act;
}) {
  const [confirmRelease, setConfirmRelease] = useState(false);
  const others = teams.filter((t) => t.id !== team.id);
  const used = team.members.length + team.invites.length;

  return (
    <div className="space-y-2 rounded-3xl border border-line bg-white p-4 shadow-soft" style={{ borderTop: `6px solid ${team.colorHex}` }}>
      <div className="flex items-center gap-3">
        <Flag kind={team.flag} color={team.colorHex} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Mesa {team.tableNumber} · {team.confirmed ? "🟢 Confirmada" : `🟡 Incompleta (${team.members.length}/${seats})`} · código {team.joinCode}
          </p>
          <p className="font-display text-base font-extrabold text-primary-dark">{team.name}</p>
          {team.motto && <p className="text-xs text-muted">“{team.motto}”</p>}
        </div>
      </div>

      <ul className="divide-y divide-line text-sm">
        {team.members.map((m) => (
          <li key={m.participantId} className="flex flex-wrap items-center gap-2 py-1.5">
            <SquirrelFigure look={m.squirrel} color={team.colorHex} size={34} crop="head" />
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-ink">
                {m.name} {m.isCaptain && <span className="text-[10px] font-extrabold text-cta">CAPITÁN</span>}
              </span>
              <span className="block text-xs text-muted">{m.email} · {m.phone}</span>
            </span>
            {!m.isCaptain && (
              <button className={btn} disabled={busy} onClick={() => act("captain", { participantId: m.participantId }, `${m.name} ahora es capitán.`)}>
                Hacer capitán
              </button>
            )}
            {others.length > 0 && (
              <select
                className="rounded-xl border border-line bg-white px-2 py-1 text-xs"
                disabled={busy}
                value=""
                onChange={(e) => e.target.value && act("move", { participantId: m.participantId, targetTeamId: e.target.value }, `${m.name} se movió de mesa.`)}
                aria-label={`Mover a ${m.name}`}
              >
                <option value="">Mover a…</option>
                {others.map((o) => (
                  <option key={o.id} value={o.id}>Mesa {o.tableNumber} · {o.name}</option>
                ))}
              </select>
            )}
            <button className={danger} disabled={busy} onClick={() => act("remove", { participantId: m.participantId }, `${m.name} salió del team.`)}>
              Sacar
            </button>
          </li>
        ))}
        {team.invites.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2 py-1.5">
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-ink">⏳ {i.name}</span>
              <span className="block text-xs text-muted">{i.email} · invitación pendiente</span>
            </span>
            <button className={btn} disabled={busy} onClick={() => act("cancel-invite", { inviteId: i.id }, "Invitación cancelada.")}>
              Cancelar invitación
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{used} de {seats} puestos ocupados (incluye invitaciones).</p>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
        {others.length > 0 && (
          <select
            className="rounded-xl border border-line bg-white px-2 py-1 text-xs"
            disabled={busy}
            value=""
            onChange={(e) => e.target.value && act("merge", { sourceId: team.id, targetId: e.target.value }, `${team.name} se fusionó y su mesa quedó libre.`)}
            aria-label="Fusionar con otra mesa"
          >
            <option value="">Fusionar en…</option>
            {others.map((o) => (
              <option key={o.id} value={o.id}>Mesa {o.tableNumber} · {o.name}</option>
            ))}
          </select>
        )}
        {!confirmRelease ? (
          <button className={btn} onClick={() => setConfirmRelease(true)}>Liberar mesa</button>
        ) : (
          <>
            <span className="text-xs font-bold text-danger">¿Liberar la mesa {team.tableNumber}? El team se borra.</span>
            <button className={danger} disabled={busy} onClick={() => act("release", { teamId: team.id }, `Mesa ${team.tableNumber} liberada.`)}>
              Sí, liberar
            </button>
            <button className={btn} onClick={() => setConfirmRelease(false)}>No</button>
          </>
        )}
      </div>
    </div>
  );
}

function EventForm({ data, busy, act }: { data: AdminMesas; busy: boolean; act: Act }) {
  const e = data.event;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: e.title,
    startsAt: toLocal(e.starts_at),
    placeName: e.place_name,
    address: e.address,
    mapsUrl: e.maps_url,
    reservationsOpenAt: toLocal(e.reservations_open_at),
    reservationsCloseAt: toLocal(e.reservations_close_at),
    tableCount: e.table_count,
    seatsPerTable: e.seats_per_table,
  });
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value });

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    await act(
      "event",
      {
        ...f,
        startsAt: fromLocal(f.startsAt),
        reservationsOpenAt: fromLocal(f.reservationsOpenAt),
        reservationsCloseAt: fromLocal(f.reservationsCloseAt),
      },
      "Datos del evento guardados.",
    );
  }

  if (!open) {
    return (
      <button className={btn} onClick={() => setOpen(true)}>
        ⚙️ Editar datos del evento y fechas de reservas
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-line bg-white p-4 shadow-soft md:grid-cols-2">
      <label className="text-xs font-bold">Nombre del evento<input className={field} value={f.title} onChange={set("title")} required /></label>
      <label className="text-xs font-bold">Fecha y hora del evento (hora Colombia)<input type="datetime-local" className={field} value={f.startsAt} onChange={set("startsAt")} required /></label>
      <label className="text-xs font-bold">Lugar (nombre, opcional)<input className={field} value={f.placeName} onChange={set("placeName")} /></label>
      <label className="text-xs font-bold">Dirección<input className={field} value={f.address} onChange={set("address")} /></label>
      <label className="text-xs font-bold md:col-span-2">Enlace de Google Maps<input className={field} value={f.mapsUrl} onChange={set("mapsUrl")} /></label>
      <label className="text-xs font-bold">Abren reservas (hora Colombia)<input type="datetime-local" className={field} value={f.reservationsOpenAt} onChange={set("reservationsOpenAt")} required /></label>
      <label className="text-xs font-bold">Cierran reservas (hora Colombia)<input type="datetime-local" className={field} value={f.reservationsCloseAt} onChange={set("reservationsCloseAt")} required /></label>
      <label className="text-xs font-bold">Número de mesas<input type="number" min={1} max={50} className={field} value={f.tableCount} onChange={set("tableCount")} required /></label>
      <label className="text-xs font-bold">Personas por mesa<input type="number" min={1} max={20} className={field} value={f.seatsPerTable} onChange={set("seatsPerTable")} required /></label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={busy} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">Guardar</button>
        <button type="button" className={btn} onClick={() => setOpen(false)}>Cerrar</button>
      </div>
    </form>
  );
}
