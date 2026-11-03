import { Suspense } from "react";
import { GameClient } from "@/components/GameClient";
import { GameError, getGameState } from "@/lib/game";
import type { GameState } from "@/lib/game-types";
import { getPlayerId } from "@/lib/session";

async function InitialGameLoader() {
  const pid = await getPlayerId();
  let initialState: GameState | null = null;
  if (pid) {
    try {
      initialState = await getGameState(pid);
    } catch (err) {
      if (!(err instanceof GameError && err.code === "unauthorized")) {
        console.error(err);
      }
      initialState = null;
    }
  }
  return <GameClient initialState={initialState} />;
}

function GameSkeleton() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-line bg-warm p-6 text-center shadow-soft">
        <p className="font-display text-sm font-bold text-primary">Cargando Ahorcadito Diario…</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <InitialGameLoader />
    </Suspense>
  );
}
