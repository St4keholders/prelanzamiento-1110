import Link from "next/link";
import { Suspense } from "react";
import { LoginGate } from "@/components/hub/LoginGate";
import { Card, Shell } from "@/components/hub/Shell";
import { ShareButton } from "@/components/ranking/ShareButton";
import { formatMs } from "@/lib/event-format";
import { getMyRanking, getRanking, getWinnersBoard } from "@/lib/ranking";
import { getPlayerId } from "@/lib/session";
import { TOTAL_DAYS, formatLongDate } from "@/lib/time";

const MEDALS = ["🥇", "🥈", "🥉"];

const DOT: Record<string, string> = {
  won: "bg-[#F2C850] border-[#E2B73A]",
  lost: "bg-danger border-danger",
  missed: "bg-[#DCD5C3] border-[#DCD5C3]",
};

function Tabs({ tab }: { tab: string }) {
  const base = "flex-1 rounded-2xl px-3 py-2 text-center font-display text-sm font-extrabold";
  return (
    <nav className="flex gap-1 rounded-3xl border border-line bg-white p-1 shadow-soft">
      <Link
        href="/ranking"
        className={`${base} ${tab === "ranking" ? "bg-primary text-white" : "text-primary-dark"}`}
      >
        🏆 Ranking
      </Link>
      <Link
        href="/ranking?tab=ganadores"
        className={`${base} ${tab === "ganadores" ? "bg-primary text-white" : "text-primary-dark"}`}
      >
        🎁 Ganadores
      </Link>
    </nav>
  );
}

async function RankingTab() {
  const [pid, rows, board] = await Promise.all([getPlayerId(), getRanking(), getWinnersBoard()]);
  const me = pid ? await getMyRanking(pid) : null;
  const top = rows.slice(0, 10);

  return (
    <>
      <p className="px-1 text-xs font-medium text-muted">
        Los <strong className="text-ink">mejores jugadores</strong> de las 11 palabras: más palabras
        adivinadas y, si empatan, menor tiempo total, menos vidas perdidas y quien se inscribió
        primero. Los <strong className="text-ink">premios</strong> están en{" "}
        <Link href="/ranking?tab=ganadores" className="font-bold text-primary underline">
          Ganadores
        </Link>
        .
      </p>

      {pid && me ? (
        <Card tone="sage" className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                Tu puesto
              </p>
              <p className="font-display text-4xl font-extrabold leading-none text-primary-dark">
                #{me.position}
                <span className="text-base font-bold text-muted"> de {me.totalPlayers}</span>
              </p>
            </div>
            <p className="text-right text-xs font-bold text-ink">{me.name}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              ["Palabras adivinadas", `${me.won} de ${TOTAL_DAYS}`],
              ["Tiempo total", formatMs(me.totalMs)],
              ["Mejor tiempo", formatMs(me.bestMs)],
              ["Racha más larga", `${me.longestStreak} ${me.longestStreak === 1 ? "día" : "días"}`],
              ["Vidas perdidas", String(me.livesLost)],
              ["Palabras jugadas", `${me.played} de ${TOTAL_DAYS}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white px-3 py-2">
                <dt className="text-[11px] font-semibold text-muted">{k}</dt>
                <dd className="font-display text-base font-extrabold text-primary-dark">{v}</dd>
              </div>
            ))}
          </dl>
          <ol className="flex gap-[5px]" aria-label="Tu racha de los 11 días">
            {me.days.map((d, i) => (
              <li key={i} className={`h-5 w-5 rounded-full border-2 ${DOT[d]}`}>
                <span className="sr-only">
                  Día {i + 1}: {d === "won" ? "adivinada" : d === "lost" ? "no adivinada" : "no jugada"}
                </span>
              </li>
            ))}
          </ol>
          <ShareButton
            src="/api/ranking/image"
            fileName={`ranking-1110-puesto-${me.position}.png`}
            label="Descargar / compartir mi imagen"
          />
        </Card>
      ) : pid ? (
        <Card tone="warm">
          <p className="text-sm font-semibold text-ink">
            No jugaste ninguna palabra del Ahorcadito, por eso no apareces en el ranking.
          </p>
        </Card>
      ) : (
        <Card tone="warm">
          <LoginGate intro="¿Jugaste? Escribe tu correo para ver tu puesto." />
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="font-display text-base font-extrabold text-primary-dark">Top 10</h2>
        <ol className="divide-y divide-line">
          {top.map((r) => (
            <li key={r.position} className="flex items-center gap-3 py-2">
              <span className="w-8 text-center font-display text-base font-extrabold text-primary">
                {MEDALS[r.position - 1] ?? `#${r.position}`}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{r.name}</span>
                <span className="text-xs text-muted">
                  {r.won} de {TOTAL_DAYS} palabras · {formatMs(r.totalMs)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      {board.bonus && (
        <Card tone="warm" className="space-y-2">
          <h2 className="font-display text-base font-extrabold text-primary-dark">
            🎁 {board.bonus.label}
          </h2>
          <p className="text-xs text-muted">
            Apartado especial: no cuenta para el ranking. La jugaron {board.bonus.played} personas y
            la adivinaron {board.bonus.guessed}.
          </p>
          {board.bonus.winner && (
            <p className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-3 py-2 text-sm font-bold text-primary-dark">
              🏆 Ganador: {board.bonus.winner.name}
              {board.bonus.winner.durationMs != null && ` · ${formatMs(board.bonus.winner.durationMs)}`}
            </p>
          )}
          <ol className="divide-y divide-line">
            {board.bonus.top.map((r) => (
              <li key={r.position} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="w-8 text-center font-display font-extrabold text-primary">
                  #{r.position}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{r.name}</span>
                <span className="text-xs font-bold text-muted">{formatMs(r.durationMs)}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-muted">Los 10 más rápidos en adivinarla.</p>
        </Card>
      )}
    </>
  );
}

async function WinnersTab() {
  const board = await getWinnersBoard();
  return (
    <>
      <p className="px-1 text-xs font-medium text-muted">
        Los <strong className="text-ink">premiados</strong>: cada día ganó la{" "}
        <strong className="text-ink">primera persona en adivinar</strong> la palabra (cada persona
        podía ganar una sola vez). El Día 1 ganaron todos los que adivinaron.
      </p>
      <Card className="space-y-1">
        <ol className="divide-y divide-line">
          {board.days.map((d) => (
            <li key={d.date} className="py-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                Día {d.dayNumber} · {formatLongDate(d.date)}
              </p>
              {d.multi ? (
                <details>
                  <summary className="cursor-pointer text-sm font-bold text-ink">
                    🎉 {d.winners.length} ganadores (todos los que adivinaron) · +25 nueces
                  </summary>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {d.winners.map((w) => w.name).join(" · ")}
                  </p>
                </details>
              ) : d.winners[0] ? (
                <p className="text-sm font-bold text-ink">
                  🏆 {d.winners[0].name}
                  <span className="font-semibold text-muted"> · {formatMs(d.winners[0].durationMs)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted">Sin ganador</p>
              )}
            </li>
          ))}
          {board.bonus && (
            <li className="py-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-cta">
                🎁 {board.bonus.label}
              </p>
              <p className="text-sm font-bold text-ink">
                {board.bonus.winner ? (
                  <>
                    🏆 {board.bonus.winner.name}
                    <span className="font-semibold text-muted">
                      {" "}
                      · {formatMs(board.bonus.winner.durationMs)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Sin ganador</span>
                )}
              </p>
            </li>
          )}
        </ol>
      </Card>
    </>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const current = tab === "ganadores" ? "ganadores" : "ranking";
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <Tabs tab={current} />
      {current === "ganadores" ? <WinnersTab /> : <RankingTab />}
    </Shell>
  );
}

export default function RankingPage(props: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-sm text-muted">Cargando ranking…</div>}
    >
      <Content {...props} />
    </Suspense>
  );
}
