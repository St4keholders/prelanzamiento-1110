import { Suspense } from "react";
import { GameClient } from "@/components/GameClient";
import { GameError, getGameState } from "@/lib/game";
import type { GameState } from "@/lib/game-types";
import { Hub } from "@/components/hub/Hub";
import { serverNow } from "@/lib/env";
import { schedulePhase } from "@/lib/schedule";
import { getSchedule } from "@/lib/schedule-server";
import { getPlayerId } from "@/lib/session";
import { getMesaState, getPublicEvent } from "@/lib/teams";

/** After the game: Ranking · Reservar mesa · Unirme a una mesa. */
async function PostGameHub({ pid }: { pid: string | null }) {
  const mesa = pid ? await getMesaState(pid).catch(() => null) : null;
  if (mesa) {
    return (
      <Hub
        event={mesa.event}
        fullName={mesa.me.fullName}
        myTeam={
          mesa.team
            ? {
                name: mesa.team.name,
                tableNumber: mesa.team.tableNumber,
                flag: mesa.team.flag,
                color: mesa.team.color,
              }
            : null
        }
        hasInvite={mesa.invite !== null}
      />
    );
  }
  return <Hub event={await getPublicEvent()} fullName={null} myTeam={null} hasInvite={false} />;
}

async function InitialGameLoader() {
  const pid = await getPlayerId();
  if (schedulePhase(await getSchedule(), serverNow()) === "ended") {
    return <PostGameHub pid={pid} />;
  }
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
        <p className="font-display text-sm font-bold text-primary">Cargando…</p>
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
