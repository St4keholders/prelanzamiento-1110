import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { getBonusSummaries, getSummary } from "@/lib/admin";
import { formatDuration } from "@/lib/time";
import { isMultiWinnerDay } from "@/lib/winner-rules";
import { getOfficialWinners } from "@/lib/winners";
import { isAdmin } from "@/lib/session";
import { allGameDates, getDayNumber } from "@/lib/time";

async function SummaryContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [{ totalParticipants, days }, winners, bonusRounds] = await Promise.all([
    getSummary(),
    getOfficialWinners(),
    getBonusSummaries(),
  ]);
  const byDate = new Map(days.map((d) => [d.game_date, d]));
  const allDates = allGameDates();

  const totalStarted = days.reduce((acc, d) => acc + Number(d.started), 0);
  const totalWon = days.reduce((acc, d) => acc + Number(d.won), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Métricas globales + exportación rápida */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary-dark">
              Resumen del reto
            </h1>
            <p className="text-sm text-muted">
              Estadísticas por día (hora Colombia). La palabra secreta solo es visible en este panel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/export?type=participants&format=xlsx"
              className="rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-white hover:bg-primary-dark"
            >
              ⬇ Inscritos (.xlsx)
            </a>
            <a
              href="/api/admin/export?type=all-results&format=xlsx"
              className="rounded-xl border border-line bg-white px-3.5 py-2 font-display text-xs font-bold text-ink hover:bg-warm"
            >
              ⬇ Todos los resultados (.xlsx)
            </a>
            <a
              href="/api/admin/export?type=all-results&format=csv"
              className="rounded-xl border border-line bg-white px-3.5 py-2 font-display text-xs font-bold text-ink hover:bg-warm"
            >
              ⬇ Todos (.csv)
            </a>
          </div>
        </div>

        {/* Tarjetas de totales */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-warm p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Total inscritos</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-primary-dark">
              {totalParticipants.toLocaleString("es-CO")}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Partidas iniciadas (acumulado)
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink">
              {totalStarted.toLocaleString("es-CO")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D4DEAF] bg-sage p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Partidas ganadas (acumulado)
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-primary-dark">
              {totalWon.toLocaleString("es-CO")}
            </p>
          </div>
        </div>

        {/* Tabla de los 11 días */}
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-warm text-xs font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Palabra del día</th>
                <th className="px-4 py-3 text-right">Iniciaron</th>
                <th className="px-4 py-3 text-right">Adivinaron</th>
                <th className="px-4 py-3">Ganador del día</th>
                <th className="px-4 py-3 text-right">Perdieron (vidas)</th>
                <th className="px-4 py-3 text-right">Perdieron (tiempo)</th>
                <th className="px-4 py-3 text-right">En curso</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allDates.map((date) => {
                const row = byDate.get(date);
                const dayNum = getDayNumber(date);
                return (
                  <tr key={date} className="hover:bg-bg/60">
                    <td className="px-4 py-3 font-display font-bold text-primary-dark">
                      Día {dayNum}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{date}</td>
                    <td className="px-4 py-3">{row?.category ?? <span className="text-muted">—</span>}</td>
                    <td className="px-4 py-3 font-display font-bold text-primary-dark">
                      {row ? (
                        row.word
                      ) : (
                        <Link
                          href="/admin/palabras"
                          className="rounded-lg bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger hover:bg-danger/20"
                        >
                          Sin cargar · cargar →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {Number(row?.started ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary tabular-nums">
                      {Number(row?.won ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-primary-dark">
                      {isMultiWinnerDay(date) ? (
                        <span>Todos los que adivinaron</span>
                      ) : winners.get(date) ? (
                        <span>🏆 {winners.get(date)?.fullName}</span>
                      ) : (
                        <span className="font-medium text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-danger tabular-nums">
                      {Number(row?.lost_errors ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-danger tabular-nums">
                      {Number(row?.lost_timeout ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted tabular-nums">
                      {Number(row?.playing ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/resultados?date=${date}`}
                        className="font-display text-xs font-bold text-primary underline hover:text-primary-dark"
                      >
                        Ver día →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bonusRounds.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-extrabold text-primary-dark">🎁 Rondas bonus</h2>
            {bonusRounds.map((b) => {
              const w = winners.get(b.id);
              const time = new Intl.DateTimeFormat("es-CO", {
                timeZone: "America/Bogota",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <div key={b.id} className="rounded-3xl border border-line bg-white p-4 shadow-soft">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-sm font-extrabold text-primary-dark">
                      {b.word} <span className="font-medium text-muted">· {b.category}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {time.format(new Date(b.opensAt))} → {time.format(new Date(b.closesAt))} ·{" "}
                      {Math.round(b.timeLimitSeconds / 60)} min · solo quienes jugaron el {b.eligibleDate}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-ink">
                    Iniciaron <strong>{b.started}</strong> · Adivinaron <strong>{b.won}</strong> ·
                    Perdieron (vidas) <strong>{b.lostErrors}</strong> · Perdieron (tiempo){" "}
                    <strong>{b.lostTimeout}</strong> · En curso <strong>{b.playing}</strong>
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary-dark">
                    {w
                      ? `🏆 Ganador: ${w.fullName} (${w.email})${w.durationMs != null ? ` · ${formatDuration(w.durationMs)}` : ""}`
                      : "Todavía no hay ganador de la ronda bonus."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default function AdminSummaryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Cargando panel…</div>}>
      <SummaryContent />
    </Suspense>
  );
}
