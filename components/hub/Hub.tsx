import Image from "next/image";
import Link from "next/link";
import { Card, Shell } from "@/components/hub/Shell";
import { Flag } from "@/components/teams/Art";
import { formatEventDate, formatShortDateTime } from "@/lib/event-format";
import type { PublicEvent } from "@/lib/team-types";
import { colorHex } from "@/lib/teams-catalog";

interface HubProps {
  event: PublicEvent;
  fullName: string | null;
  myTeam: { name: string; tableNumber: number; flag: string; color: string } | null;
  hasInvite: boolean;
}

/** Home after the game: Ranking · Reservar mesa · Unirme a una mesa (or "Mi team"). */
export function Hub({ event, fullName, myTeam, hasInvite }: HubProps) {
  const free = Math.max(0, event.tableCount - event.tablesTaken);
  const closed = !event.reservationsOpen;

  return (
    <Shell>
      <Card tone="sage" className="flex items-center gap-3">
        <Image
          src="/mascot-avatar-happy.png"
          alt=""
          width={72}
          height={72}
          priority
          className="h-18 w-18 shrink-0 object-contain"
        />
        <div>
          <p className="font-display text-[11px] font-extrabold uppercase tracking-wider text-primary">
            {fullName ? `Hola, ${fullName.split(" ")[0]}` : "Evento de lanzamiento"}
          </p>
          <h1 className="font-display text-xl font-extrabold leading-tight text-primary-dark">
            ¡Nos vemos en el {event.title}!
          </h1>
          <p className="text-xs font-medium text-ink">
            {formatEventDate(event.startsAt)}
            <br />
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary underline underline-offset-2"
            >
              📍 {event.address}
            </a>
          </p>
        </div>
      </Card>

      <Link
        href="/ranking"
        className="flex items-center justify-between rounded-3xl border border-line bg-white p-4 shadow-soft hover:bg-warm"
      >
        <span>
          <span className="block font-display text-base font-extrabold text-primary-dark">
            🏆 Ranking y ganadores
          </span>
          <span className="text-xs text-muted">Los mejores jugadores y los premiados de cada día</span>
        </span>
        <span className="text-lg text-primary">→</span>
      </Link>

      {myTeam ? (
        <Link
          href="/mesa"
          className="flex items-center gap-3 rounded-3xl border-2 bg-white p-4 shadow-soft"
          style={{ borderColor: colorHex(myTeam.color) }}
        >
          <Flag kind={myTeam.flag} color={colorHex(myTeam.color)} size={64} />
          <span className="flex-1">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Mi team · Mesa {myTeam.tableNumber}
            </span>
            <span className="block font-display text-base font-extrabold text-primary-dark">
              {myTeam.name}
            </span>
          </span>
          <span className="text-lg text-primary">→</span>
        </Link>
      ) : (
        <>
          {hasInvite && (
            <Link
              href="/mesa"
              className="rounded-3xl border-2 border-cta bg-white p-4 text-center font-display text-sm font-extrabold text-cta shadow-soft"
            >
              📩 Tienes una invitación a un team. Ver invitación →
            </Link>
          )}
          <Link
            href="/mesa"
            className={`flex items-center justify-between rounded-3xl p-4 shadow-soft ${
              closed || free === 0
                ? "border border-line bg-warm text-muted"
                : "bg-cta text-white"
            }`}
          >
            <span>
              <span className="block font-display text-base font-extrabold">🪑 Reservar mesa</span>
              <span className="text-xs font-semibold opacity-90">
                {closed
                  ? "Las reservas están cerradas"
                  : free === 0
                    ? "Mesas agotadas"
                    : `Crea tu Team de Ardillas · quedan ${free} de ${event.tableCount} mesas`}
              </span>
            </span>
            <span className="text-lg">→</span>
          </Link>
          <Link
            href="/mesa/unirme"
            className="flex items-center justify-between rounded-3xl border border-line bg-white p-4 shadow-soft hover:bg-warm"
          >
            <span>
              <span className="block font-display text-base font-extrabold text-primary-dark">
                🔑 Unirme a una mesa
              </span>
              <span className="text-xs text-muted">Con el código o enlace que te pasó el capitán</span>
            </span>
            <span className="text-lg text-primary">→</span>
          </Link>
        </>
      )}

      <p className="text-center text-[11px] font-medium text-muted">
        {event.reservationsOpen
          ? `Reservas abiertas hasta el ${formatShortDateTime(event.reservationsCloseAt)} · ${event.seatsPerTable} personas por mesa`
          : `${event.tableCount} mesas de ${event.seatsPerTable} personas`}
      </p>
    </Shell>
  );
}
