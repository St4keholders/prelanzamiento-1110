"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { LookEditor } from "@/components/mesa/LookEditor";
import { ColorPicker, FlagPicker } from "@/components/mesa/Pickers";
import { TeamPreview } from "@/components/mesa/TeamPreview";
import { ShareButton } from "@/components/ranking/ShareButton";
import { Flag } from "@/components/teams/Art";
import { formatEventDate, formatShortDateTime } from "@/lib/event-format";
import { DEFAULT_LOOK } from "@/lib/squirrel-look";
import type { MesaState, PublicTeam } from "@/lib/team-types";
import { colorHex } from "@/lib/teams-catalog";

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
  const free = Math.max(0, event.tableCount - event.tablesTaken);

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
        <MyTeam team={team} open={event.reservationsOpen} busy={busy} act={act} />
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
          <p className="font-display text-lg font-extrabold text-primary-dark">Mesas agotadas 🐿️</p>
          <p className="text-sm text-ink">
            Ya se reservaron las {event.tableCount} mesas. Si un capitán te pasa su código, todavía
            puedes unirte a su team si le quedan puestos.
          </p>
          <Link href="/mesa/unirme" className={`${primaryBtn} block text-center`}>
            Unirme con un código
          </Link>
        </Box>
      ) : (
        <CreateTeam free={free} total={event.tableCount} busy={busy} act={act} />
      )}
    </div>
  );
}

type Act = (action: string, body?: unknown, okText?: string) => Promise<boolean>;

function CreateTeam({ free, total, busy, act }: { free: number; total: number; busy: boolean; act: Act }) {
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("partida-doble");
  const [color, setColor] = useState("verde");
  const [motto, setMotto] = useState("");
  const [squirrel, setSquirrel] = useState(DEFAULT_LOOK);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await act("create", { name, flag, color, motto, squirrel }, "¡Mesa reservada! Ahora invita a tu team.");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Box>
        <div>
          <p className="font-display text-lg font-extrabold text-primary-dark">Crea tu Team de Ardillas</p>
          <p className="text-xs text-muted">
            Quedan <strong className="text-ink">{free} de {total}</strong> mesas. La primera persona en
            crear su team se queda con la mesa; tú serás el capitán.
          </p>
        </div>
        <div>
          <label htmlFor="team-name" className={label}>Nombre del team</label>
          <input
            id="team-name"
            className={input}
            required
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Los Debe y Haber"
          />
        </div>
        <div>
          <label htmlFor="team-motto" className={label}>Lema o grito de guerra (opcional)</label>
          <input
            id="team-motto"
            className={input}
            maxLength={60}
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="Ej. Ni un peso sin conciliar"
          />
        </div>
      </Box>
      <Box>
        <p className={label}>Color del team</p>
        <ColorPicker value={color} onChange={setColor} />
        <p className={label}>Bandera del team</p>
        <FlagPicker value={flag} color={color} onChange={setFlag} />
      </Box>
      <Box>
        <p className={label}>Arma tu ardilla</p>
        <LookEditor value={squirrel} color={colorHex(color)} onChange={setSquirrel} />
      </Box>
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? "Reservando…" : "Reservar mesa"}
      </button>
    </form>
  );
}

function InviteView({ state, busy, act }: { state: MesaState; busy: boolean; act: Act }) {
  const inv = state.invite!;
  const [squirrel, setSquirrel] = useState(DEFAULT_LOOK);
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
        <>
          <p className={label}>Arma tu ardilla para aceptar</p>
          <LookEditor value={squirrel} color={colorHex(inv.color)} onChange={setSquirrel} />
          <button
            type="button"
            disabled={busy}
            onClick={() => act("accept", { squirrel }, "¡Ya eres parte del team!")}
            className={primaryBtn}
          >
            Aceptar invitación
          </button>
          <button type="button" disabled={busy} onClick={() => act("decline")} className={secondaryBtn}>
            Rechazar
          </button>
        </>
      ) : (
        <p className="text-sm text-ink">Las reservas ya cerraron; no se puede aceptar la invitación.</p>
      )}
    </Box>
  );
}

function MyTeam({ team, open, busy, act }: { team: PublicTeam; open: boolean; busy: boolean; act: Act }) {
  const me = team.members.find((m) => m.isMe);
  const seatsLeft = team.seatsTotal - team.seatsUsed;
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const joinUrl = () => `${window.location.origin}/m/${team.joinCode}`;

  async function shareLink() {
    const url = joinUrl();
    setLink(url);
    const text = `¡Únete a mi Team de Ardillas "${team.name}" (mesa ${team.tableNumber}) para el lanzamiento de 1110! ${url}`;
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
      <TeamPreview team={team} />

      <Box tone={team.confirmed ? "sage" : "warm"}>
        <p className="text-sm font-bold text-primary-dark">
          {team.confirmed
            ? "✅ ¡Mesa confirmada! Ya son todos."
            : `Faltan ${team.seatsTotal - team.members.length} para confirmar la mesa (se confirma con ${team.seatsTotal} integrantes que aceptaron).`}
        </p>
        {team.joinCode && seatsLeft > 0 && open && (
          <>
            <p className="text-xs text-ink">
              Comparte este código o enlace con tus colegas:
              <span className="ml-1 rounded-lg bg-white px-2 py-0.5 font-display text-base font-extrabold tracking-widest text-primary-dark">
                {team.joinCode}
              </span>
            </p>
            <button type="button" onClick={shareLink} className={primaryBtn}>
              Compartir enlace del team
            </button>
            {link && copied && (
              <p className="break-all text-[11px] font-semibold text-muted">Copiado: {link}</p>
            )}
          </>
        )}
      </Box>

      <ShareButton src="/api/teams-card" fileName={`team-${team.joinCode ?? "1110"}.png`} label="Ver y compartir la tarjeta del team" />

      {team.isCaptain && open && (
        <CaptainTools team={team} seatsLeft={seatsLeft} busy={busy} act={act} />
      )}

      {me && open && (
        <MySquirrel current={me.squirrel} color={colorHex(team.color)} busy={busy} act={act} />
      )}

      {open && (
        <Box>
          {!leaving ? (
            <button type="button" onClick={() => setLeaving(true)} className={secondaryBtn}>
              Salir del team
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">
                {team.isCaptain
                  ? team.members.length > 1
                    ? "Si sales, la capitanía pasa al integrante más antiguo."
                    : "Eres el único integrante: si sales, la mesa se libera para otro team."
                  : "¿Seguro que quieres salir del team?"}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (await act("leave", {}, "Saliste del team.")) setLeaving(false);
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
          Las reservas cerraron: el team ya no se puede modificar desde aquí.
        </p>
      )}
    </div>
  );
}

function CaptainTools({
  team,
  seatsLeft,
  busy,
  act,
}: {
  team: PublicTeam;
  seatsLeft: number;
  busy: boolean;
  act: Act;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [tName, setTName] = useState(team.name);
  const [tFlag, setTFlag] = useState(team.flag);
  const [tColor, setTColor] = useState(team.color);
  const [tMotto, setTMotto] = useState(team.motto);

  return (
    <>
      {seatsLeft > 0 && (
        <Box>
          <p className="font-display text-base font-extrabold text-primary-dark">Invitar por correo</p>
          <p className="text-xs text-muted">
            El puesto queda apartado hasta que tu colega entre al sitio con ese correo y acepte.
          </p>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act("invite", { email, fullName: name }, "Invitación enviada. Avísale que entre con ese correo.")) {
                setEmail("");
                setName("");
              }
            }}
          >
            <input className={input} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" maxLength={120} />
            <input className={input} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />
            <button type="submit" disabled={busy} className={secondaryBtn}>
              Invitar
            </button>
          </form>
        </Box>
      )}

      {(team.invites.length > 0 || team.members.length > 1) && (
        <Box>
          <p className="font-display text-base font-extrabold text-primary-dark">Integrantes e invitaciones</p>
          <ul className="divide-y divide-line">
            {team.members
              .filter((m) => !m.isMe)
              .map((m) => (
                <li key={m.participantId} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="font-semibold text-ink">{m.name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act("remove", { id: m.participantId }, `${m.name} salió del team.`)}
                    className="text-xs font-bold text-danger underline"
                  >
                    Sacar
                  </button>
                </li>
              ))}
            {team.invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold text-ink">⏳ {i.name}</span>
                  <span className="block text-xs text-muted">{i.email}</span>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act("cancel-invite", { id: i.id }, "Invitación cancelada.")}
                  className="text-xs font-bold text-danger underline"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <Box>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className={secondaryBtn}>
            Editar nombre, bandera, color o lema
          </button>
        ) : (
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act("update", { name: tName, flag: tFlag, color: tColor, motto: tMotto }, "Team actualizado."))
                setEditing(false);
            }}
          >
            <input className={input} required maxLength={30} value={tName} onChange={(e) => setTName(e.target.value)} />
            <input className={input} maxLength={60} value={tMotto} onChange={(e) => setTMotto(e.target.value)} placeholder="Lema (opcional)" />
            <ColorPicker value={tColor} onChange={setTColor} />
            <FlagPicker value={tFlag} color={tColor} onChange={setTFlag} />
            <button type="submit" disabled={busy} className={primaryBtn}>
              Guardar cambios
            </button>
            <button type="button" onClick={() => setEditing(false)} className={secondaryBtn}>
              Cancelar
            </button>
          </form>
        )}
      </Box>
    </>
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
