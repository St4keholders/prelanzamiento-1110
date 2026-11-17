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
        <p className="font-display text-lg font-extrabold text-primary-dark">No encontramos ese team</p>
        <p className="text-sm text-ink">Revisa el código con tu capitán.</p>
        <Link href="/mesa/unirme" className="text-sm font-bold text-primary underline">
          Probar con otro código
        </Link>
      </Card>
    );
  }

  const seatsLeft = team.seatsTotal - team.seatsUsed;
  let action: React.ReactNode;

  if (!pid) {
    action = (
      <Card tone="warm">
        <LoginGate intro={`Entra con tu correo para unirte a ${team.name}.`} />
      </Card>
    );
  } else {
    const mesa = await getMesaState(pid).catch(() => null);
    const invitedHere = mesa?.invite && mesa.invite.tableNumber === team.tableNumber;
    if (mesa?.team?.id === team.id) {
      action = (
        <Card tone="sage">
          <p className="text-sm font-bold text-primary-dark">Ya eres parte de este team.</p>
          <Link href="/mesa" className="text-sm font-bold text-primary underline">Ver mi team</Link>
        </Card>
      );
    } else if (mesa?.team) {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">
            Ya perteneces a otro team ({mesa.team.name}). Para unirte a este, primero sal del tuyo.
          </p>
          <Link href="/mesa" className="text-sm font-bold text-primary underline">Ver mi team</Link>
        </Card>
      );
    } else if (!event.reservationsOpen) {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">Las reservas de mesa están cerradas.</p>
        </Card>
      );
    } else if (seatsLeft <= 0 && !invitedHere) {
      action = (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">Este team ya no tiene puestos libres.</p>
        </Card>
      );
    } else if (mesa) {
      action = <JoinClient code={code} color={colorHex(team.color)} me={mesa.me} />;
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
      <p className="px-1 text-sm font-semibold text-ink">Te invitaron a este Team de Ardillas:</p>
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
