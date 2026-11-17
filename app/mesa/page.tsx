import { Suspense } from "react";
import { LoginGate } from "@/components/hub/LoginGate";
import { Card, Shell } from "@/components/hub/Shell";
import { MesaClient } from "@/components/mesa/MesaClient";
import { getPlayerId } from "@/lib/session";
import { getMesaState } from "@/lib/teams";

async function Content() {
  const pid = await getPlayerId();
  if (!pid) {
    return (
      <Card tone="warm">
        <LoginGate intro="Entra con el correo con el que te inscribiste para reservar o ver tu mesa." />
      </Card>
    );
  }
  const state = await getMesaState(pid).catch(() => null);
  if (!state) {
    return (
      <Card tone="warm">
        <LoginGate intro="Tu sesión expiró. Escribe tu correo de nuevo." />
      </Card>
    );
  }
  return <MesaClient initial={state} />;
}

export default function MesaPage() {
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Cargando…</p>}>
        <Content />
      </Suspense>
    </Shell>
  );
}
