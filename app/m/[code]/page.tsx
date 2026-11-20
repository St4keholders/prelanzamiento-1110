import Link from "next/link";
import { Suspense } from "react";
import { LoginGate } from "@/components/hub/LoginGate";
import { Card, Shell } from "@/components/hub/Shell";
import { JoinClient } from "@/components/mesa/JoinClient";
import { TeamPreview } from "@/components/mesa/TeamPreview";
import { getPlayerId } from "@/lib/session";
import { getMesaState, getPublicEvent, getTeamByCode } from "@/lib/teams";
import { colorHex } from "@/lib/teams-catalog";

async function Content({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const pid = await getPlayerId();
  const [team, event] = await Promise.all([getTeamByCode(code, pid), getPublicEvent()]);

  if (!team) {
    return (
      <Card tone="warm" className="space-y-2">
        <p className="font-display text-lg font-extrabold text-primary-dark">Esa mesa ya no existe</p>
        <p className="text-sm text-ink">
          Puede que el enlace esté mal escrito o que la mesa haya quedado vacía. Igual puedes escoger la mesa que
          quieras.
        </p>
        <Link href="/mesa" className="text-sm font-bold text-primary underline">
          Ver las mesas
        </Link>
      </Card>
    );
  }

  const seatsLeft = team.seatsTotal - team.seatsUsed;
  let action: React.ReactNode;

  if (!pid) {
    action = (
      <Card tone="warm">
        <LoginGate intro={`Entra con tu correo para unirte a la mesa ${team.tableNumber}: ${team.name}.`} />
      </Card>
    );
  } else {
    const mesa = await getMesaState(pid).catch(() => null);
    if (mesa?.team?.id === team.id) {
      action = (
        <Card tone="sage">
          <p className="text-sm font-bold text-primary-dark">Ya estás en esta mesa.</p>
          <Link href="/mesa" className="text-sm font-bold text-primary underline">Ver mi mesa</Link>
        </Card>
      );
    } else if (!event.reservationsOpen) {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">Las reservas de mesa están cerradas.</p>
        </Card>
      );
    } else if (seatsLeft <= 0 || team.staff) {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">Esta mesa ya está llena.</p>
          <Link href="/mesa" className="text-sm font-bold text-primary underline">Ver otras mesas</Link>
        </Card>
      );
    } else if (mesa?.team) {
      action = (
        <Card tone="warm" className="space-y-2">
          <p className="text-sm font-semibold text-ink">
            Ahora estás en la mesa {mesa.team.tableNumber} ({mesa.team.name}). ¿Te cambias a esta?
          </p>
          <JoinClient tableNumber={team.tableNumber} color={colorHex(team.color)} me={mesa.me} moving />
        </Card>
      );
    } else if (mesa) {
      action = <JoinClient tableNumber={team.tableNumber} color={colorHex(team.color)} me={mesa.me} />;
    } else {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">No pudimos cargar tus datos. Recarga la página.</p>
        </Card>
      );
    }
  }

  return (
    <>
      <p className="px-1 text-sm font-semibold text-ink">Te invitaron a esta mesa:</p>
      <TeamPreview team={team} />
      {action}
    </>
  );
}

export default function JoinPage(props: { params: Promise<{ code: string }> }) {
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Cargando…</p>}>
        <Content {...props} />
      </Suspense>
    </Shell>
  );
}
