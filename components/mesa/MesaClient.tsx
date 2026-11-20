"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { LookEditor } from "@/components/mesa/LookEditor";
import { ContactFields, contactFrom } from "@/components/mesa/ContactFields";
import { freeTables, TablePicker } from "@/components/mesa/TablePicker";
import { TeamPreview } from "@/components/mesa/TeamPreview";
import { ShareButton } from "@/components/ranking/ShareButton";
import { Flag } from "@/components/teams/Art";
import { formatEventDate, formatShortDateTime } from "@/lib/event-format";
import { DEFAULT_LOOK } from "@/lib/squirrel-look";
import type { MesaState, MyContact, PublicTeam } from "@/lib/team-types";
import { colorHex, tableInfo } from "@/lib/teams-catalog";

const input =
  "w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink";
const label = "mb-1 block text-xs font-bold text-ink";
const primaryBtn =
  "w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft active:translate-y-0.5 disabled:opacity-50";
const secondaryBtn =
  "w-full rounded-2xl border border-line bg-white px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-primary-dark shadow-soft disabled:opacity-50";

function Box({ children, tone = "white" }: { children: ReactNode; tone?: "white" | "warm" | "sage" }) {
  const bg = tone === "warm" ? "bg-warm" : tone === "sage" ? "bg-sage" : "bg-white";
  return <section className={`rounded-3xl border border-line ${bg} p-4 shadow-soft space-y-3`}>{children}</section>;
}

export function MesaClient({ initial }: { initial: MesaState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(action: string, body: unknown = {}, okText?: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/teams/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) router.refresh();
        setError(data.message ?? "No se pudo completar la acción.");
        // Refresca el estado por si cambió (mesa tomada, cupo lleno…).
        const fresh = await fetch("/api/teams/state", { cache: "no-store" });
        if (fresh.ok) setState(await fresh.json());
        return false;
      }
      setState(data as MesaState);
      if (okText) setNotice(okText);
      router.refresh();
      return true;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const { event, team, invite } = state;
  const free = freeTables(event);

  return (
    <div className="space-y-3">
      <Box tone="sage">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">{event.title}</p>
        <p className="text-sm font-bold text-primary-dark">{formatEventDate(event.startsAt)}</p>
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-primary underline underline-offset-2"
        >
          📍 {event.address}
        </a>
        <p className="text-[11px] text-muted">
          {event.reservationsOpen
            ? `Reservas abiertas hasta el ${formatShortDateTime(event.reservationsCloseAt)}`
            : "Las reservas están cerradas"}{" "}
          · {event.tableCount} mesas de {event.seatsPerTable} personas
        </p>
      </Box>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-2xl bg-sage px-4 py-2.5 text-sm font-bold text-primary">
          {notice}
        </p>
      )}

      {team ? (
        <MyTeam team={team} me={state.me} event={event} busy={busy} act={act} />
      ) : invite ? (
        <InviteView state={state} busy={busy} act={act} />
      ) : !event.reservationsOpen ? (
        <Box tone="warm">
          <p className="text-sm font-semibold text-ink">
            Las reservas de mesa están cerradas. Si tienes dudas, escríbenos por Instagram.
          </p>
        </Box>
      ) : free === 0 ? (
        <Box tone="warm">
          <p className="font-display text-lg font-extrabold text-primary-dark">Mesas llenas 🐿️</p>
          <p className="text-sm text-ink">
            Ya no quedan puestos en ninguna de las {event.tableCount} mesas. Si alguien se sale, el puesto
            vuelve a aparecer aquí.
          </p>
        </Box>
      ) : (
        <JoinTable me={state.me} event={event} busy={busy} act={act} />
      )}
    </div>
  );
}

type Act = (action: string, body?: unknown, okText?: string) => Promise<boolean>;

function JoinTable({
  me,
  event,
  busy,
  act,
}: {
  me: MyContact;
  event: MesaState["event"];
  busy: boolean;
  act: Act;
}) {
  const [contact, setContact] = useState(() => contactFrom(me));
  const [table, setTable] = useState<number | null>(null);
  const [squirrel, setSquirrel] = useState(DEFAULT_LOOK);
  const chosen = table ? tableInfo(table) : undefined;
  const empty = table !== null && !event.tables.some((t) => t.number === table && t.seatsUsed > 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!table) return;
    await act(
      "seat",
      { ...contact, tableNumber: table, squirrel },
      empty ? `¡Estás en la mesa ${table}! Llegaste primero: eres el capitán.` : `¡Ya estás en la mesa ${table}!`,
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Box>
        <div>
          <p className="font-display text-lg font-extrabold text-primary-dark">Escoge tu mesa</p>
          <p className="text-xs text-muted">
            Únete a la mesa que quieras, aunque no conozcas a nadie: así se arman los Teams de Ardillas. Cada
            mesa es de {event.seatsPerTable} personas y puedes cambiarte hasta que cierren las reservas.
          </p>
        </div>
        <TablePicker event={event} value={table} onChange={setTable} />
      </Box>
      {chosen && (
        <>
          <Box>
            <div>
              <p className="font-display text-base font-extrabold text-primary-dark">Tus datos</p>
              <p className="text-xs text-muted">Los necesitamos para confirmar tu puesto en el evento.</p>
            </div>
            <ContactFields email={me.email} askConsent={!me.dataConsent} value={contact} onChange={setContact} idPrefix="seat" />
          </Box>
          <Box>
            <p className={label}>Arma tu ardilla</p>
            <LookEditor value={squirrel} color={colorHex(chosen.color)} onChange={setSquirrel} />
          </Box>
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? "Guardando…" : `Unirme a la mesa ${chosen.number}`}
          </button>
        </>
      )}
    </form>
  );
}

function InviteView({ state, busy, act }: { state: MesaState; busy: boolean; act: Act }) {
  const inv = state.invite!;
  const [squirrel, setSquirrel] = useState(DEFAULT_LOOK);
  const [contact, setContact] = useState(() => contactFrom(state.me));
  return (
    <Box>
      <div className="flex items-center gap-3">
        <Flag kind={inv.flag} color={colorHex(inv.color)} size={72} />
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-cta">📩 Te invitaron</p>
          <p className="font-display text-lg font-extrabold text-primary-dark">{inv.teamName}</p>
          <p className="text-xs text-muted">
            Mesa {inv.tableNumber} · capitán: {inv.captainName}
          </p>
        </div>
      </div>
      {state.event.reservationsOpen ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act("accept", { ...contact, squirrel }, "¡Ya eres parte del team!");
          }}
        >
          <p className="font-display text-base font-extrabold text-primary-dark">Tus datos</p>
          <ContactFields email={state.me.email} askConsent={!state.me.dataConsent} value={contact} onChange={setContact} idPrefix="accept" />
          <p className={label}>Arma tu ardilla</p>
          <LookEditor value={squirrel} color={colorHex(inv.color)} onChange={setSquirrel} />
          <button type="submit" disabled={busy} className={primaryBtn}>
            Aceptar invitación
          </button>
          <button type="button" disabled={busy} onClick={() => act("decline")} className={secondaryBtn}>
            Rechazar
          </button>
        </form>
      ) : (
        <p className="text-sm text-ink">Las reservas ya cerraron; no se puede aceptar la invitación.</p>
      )}
    </Box>
  );
}

function MyTeam({
  team,
  me: contactMe,
  event,
  busy,
  act,
}: {
  team: PublicTeam;
  me: MyContact;
  event: MesaState["event"];
  busy: boolean;
  act: Act;
}) {
  const open = event.reservationsOpen;
  const me = team.members.find((m) => m.isMe);
  const seatsLeft = team.seatsTotal - team.seatsUsed;
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const joinUrl = () => `${window.location.origin}/m/${team.joinCode}`;

  async function shareLink() {
    const url = joinUrl();
    setLink(url);
    const text = `¡Únete a mi mesa "${team.name}" (mesa ${team.tableNumber}) en el lanzamiento de 1110! ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      return; // canceló el menú de compartir
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      {!contactMe.profession && <MyData me={contactMe} busy={busy} act={act} missing />}

      <TeamPreview team={team} />

      <Box tone={team.confirmed ? "sage" : "warm"}>
        <p className="text-sm font-bold text-primary-dark">
          {team.confirmed
            ? "✅ ¡Mesa completa! Ya están los " + team.seatsTotal + "."
            : `Quedan ${seatsLeft} ${seatsLeft === 1 ? "puesto" : "puestos"} en tu mesa. Se irán llenando con quienes la escojan.`}
        </p>
        {team.joinCode && seatsLeft > 0 && open && (
          <>
            <p className="text-xs text-ink">
              ¿Vienes con amigos? Compárteles este enlace y quedan en tu mesa mientras haya puesto.
            </p>
            <button type="button" onClick={shareLink} className={primaryBtn}>
              Compartir enlace de mi mesa
            </button>
            {link && copied && (
              <p className="break-all text-[11px] font-semibold text-muted">Copiado: {link}</p>
            )}
          </>
        )}
      </Box>

      <ShareButton src="/api/teams-card" fileName={`team-${team.joinCode ?? "1110"}.png`} label="Ver y compartir la tarjeta del team" />

      {team.isCaptain && open && <CaptainTools team={team} busy={busy} act={act} />}

      {open && <MoveTable team={team} event={event} busy={busy} act={act} />}

      {me && open && (
        <MySquirrel current={me.squirrel} color={colorHex(team.color)} busy={busy} act={act} />
      )}

      {contactMe.profession && <MyData me={contactMe} busy={busy} act={act} />}

      {open && (
        <Box>
          {!leaving ? (
            <button type="button" onClick={() => setLeaving(true)} className={secondaryBtn}>
              Salir de la mesa
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">
                {team.isCaptain
                  ? team.members.length > 1
                    ? "Si sales, la capitanía pasa al integrante más antiguo."
                    : "Eres el único en la mesa: si sales, queda vacía para otros."
                  : "¿Seguro que quieres salir de la mesa? Tu puesto queda libre."}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (await act("leave", {}, "Saliste de la mesa.")) setLeaving(false);
                }}
                className="w-full rounded-2xl bg-danger px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-white"
              >
                Sí, salir
              </button>
              <button type="button" onClick={() => setLeaving(false)} className={secondaryBtn}>
                Cancelar
              </button>
            </div>
          )}
        </Box>
      )}
      {!open && (
        <p className="text-center text-xs text-muted">
          Las reservas cerraron: ya no puedes cambiarte de mesa desde aquí.
        </p>
      )}
    </div>
  );
}

/** El capitán (quien llegó primero a la mesa) solo edita el lema. */
function CaptainTools({ team, busy, act }: { team: PublicTeam; busy: boolean; act: Act }) {
  const [editing, setEditing] = useState(false);
  const [tMotto, setTMotto] = useState(team.motto);

  return (
    <Box>
      {!editing ? (
        <>
          <p className="text-xs text-muted">
            Eres el capitán porque llegaste primero. Puedes ponerle un lema o grito de guerra a la mesa.
          </p>
          <button type="button" onClick={() => setEditing(true)} className={secondaryBtn}>
            {team.motto ? "Editar el lema" : "Ponerle un lema a la mesa"}
          </button>
        </>
      ) : (
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await act("update", { motto: tMotto }, "Lema actualizado.")) setEditing(false);
          }}
        >
          <input
            className={input}
            maxLength={60}
            value={tMotto}
            onChange={(e) => setTMotto(e.target.value)}
            placeholder="Ej. Ni un peso sin conciliar"
          />
          <button type="submit" disabled={busy} className={primaryBtn}>
            Guardar lema
          </button>
          <button type="button" onClick={() => setEditing(false)} className={secondaryBtn}>
            Cancelar
          </button>
        </form>
      )}
    </Box>
  );
}

/** Cambiarse a otra mesa con puesto libre (conserva sus datos y su ardilla). */
function MoveTable({
  team,
  event,
  busy,
  act,
}: {
  team: PublicTeam;
  event: MesaState["event"];
  busy: boolean;
  act: Act;
}) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState<number | null>(null);
  const chosen = table ? tableInfo(table) : undefined;
  if (freeTables(event, team.tableNumber) === 0) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={secondaryBtn}>
        🔄 Cambiarme de mesa
      </button>
    );
  }
  return (
    <Box>
      <p className="font-display text-base font-extrabold text-primary-dark">Cambiarme de mesa</p>
      <TablePicker event={event} value={table} onChange={setTable} current={team.tableNumber} />
      {chosen && (
        <>
          <p className="text-xs text-ink">
            Dejas tu puesto en {team.name}
            {team.isCaptain
              ? team.members.length > 1
                ? " y la capitanía pasa al integrante más antiguo"
                : " y esa mesa queda vacía"
              : ""}
            .
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await act("move", { tableNumber: chosen.number }, `¡Te cambiaste a la mesa ${chosen.number}!`)) {
                setOpen(false);
                setTable(null);
              }
            }}
            className={primaryBtn}
          >
            {busy ? "Cambiando…" : `Cambiarme a la mesa ${chosen.number}`}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setTable(null);
        }}
        className={secondaryBtn}
      >
        Cancelar
      </button>
    </Box>
  );
}

/** Datos de contacto: aviso si falta la profesión (ej. agregados desde el panel), o editables. */
function MyData({ me, busy, act, missing = false }: { me: MyContact; busy: boolean; act: Act; missing?: boolean }) {
  const [open, setOpen] = useState(missing);
  const [contact, setContact] = useState(() => contactFrom(me));
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={secondaryBtn}>
        ✏️ Mis datos de contacto
      </button>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if ((await act("profile", contact, "Tus datos quedaron guardados.")) && !missing) setOpen(false);
      }}
    >
      <Box tone={missing ? "warm" : "white"}>
        <div>
          <p className="font-display text-base font-extrabold text-primary-dark">
            {missing ? "⚠️ Completa tus datos" : "Mis datos de contacto"}
          </p>
          {missing && (
            <p className="text-xs text-ink">Los necesitamos para confirmar tu puesto en el evento.</p>
          )}
        </div>
        <ContactFields email={me.email} askConsent={!me.dataConsent} value={contact} onChange={setContact} idPrefix="me" />
        <button type="submit" disabled={busy} className={primaryBtn}>
          Guardar mis datos
        </button>
        {!missing && (
          <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>
            Cancelar
          </button>
        )}
      </Box>
    </form>
  );
}

function MySquirrel({
  current,
  color,
  busy,
  act,
}: {
  current: string;
  color: string;
  busy: boolean;
  act: Act;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={secondaryBtn}>
        Cambiar mi ardilla
      </button>
    );
  }
  return (
    <Box>
      <LookEditor value={value} color={color} onChange={setValue} />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (await act("squirrel", { squirrel: value }, "Ardilla actualizada.")) setOpen(false);
        }}
        className={primaryBtn}
      >
        Guardar mi ardilla
      </button>
    </Box>
  );
}
