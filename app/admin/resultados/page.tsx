import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PAGE_SIZE, getResultsPage } from "@/lib/admin";
import {
  type TitleStatus,
  describeTitle,
  isMultiWinnerDay,
  titleStatus,
} from "@/lib/winner-rules";
import { byEmail, getOfficialWinners } from "@/lib/winners";
import { serverNow } from "@/lib/env";
import { reasonLabel, statusLabel } from "@/lib/export";
import { isAdmin } from "@/lib/session";
import {
  FIRST_DATE,
  allGameDates,
  formatDateTimeBogota,
  formatDuration,
  getDayNumber,
  isGameDate,
} from "@/lib/time";
import { currentGameDate } from "@/lib/game";

interface SearchProps {
  searchParams: Promise<{ date?: string; q?: string; page?: string }>;
}

async function ResultadosContent({ searchParams }: SearchProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const activeDate = await currentGameDate(serverNow());
  const defaultDate = activeDate && isGameDate(activeDate) ? activeDate : FIRST_DATE;
  const selectedDate = params.date && isGameDate(params.date) ? params.date : defaultDate;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [{ rows, total }, official] = await Promise.all([
    getResultsPage(selectedDate, q, page),
    getOfficialWinners(),
  ]);
  const winners = byEmail(official);
  const dayWinner = official.get(selectedDate);
  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));
  const dates = allGameDates();

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary-dark">
              Resultados · Día {getDayNumber(selectedDate)} ({selectedDate})
            </h1>
            <p className="text-sm text-muted">
              Ordenados por hora de finalización (el primero que terminó aparece arriba).
            </p>
            <p className="mt-1 text-sm font-bold text-primary-dark">
              {isMultiWinnerDay(selectedDate)
                ? "Día de varios ganadores: todos los que adivinaron ganan (+25 nueces)."
                : dayWinner
                  ? `🏆 Ganador del día: ${dayWinner.fullName} (${dayWinner.email})`
                  : "Todavía no hay ganador para este día."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/admin/export?type=results&date=${selectedDate}&format=xlsx`}
              className="rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-white hover:bg-primary-dark"
            >
              ⬇ Día {getDayNumber(selectedDate)} (.xlsx)
            </a>
            <a
              href={`/api/admin/export?type=results&date=${selectedDate}&format=csv`}
              className="rounded-xl border border-line bg-white px-3.5 py-2 font-display text-xs font-bold text-ink hover:bg-warm"
            >
              ⬇ Día {getDayNumber(selectedDate)} (.csv)
            </a>
            <a
              href="/api/admin/export?type=all-results&format=xlsx"
              className="rounded-xl border border-line bg-warm px-3.5 py-2 font-display text-xs font-bold text-primary-dark hover:bg-sage"
            >
              ⬇ Todos los días (.xlsx)
            </a>
            <a
              href="/api/admin/export?type=all-results&format=csv"
              className="rounded-xl border border-line bg-warm px-3.5 py-2 font-display text-xs font-bold text-primary-dark hover:bg-sage"
            >
              ⬇ Todos los días (.csv)
            </a>
          </div>
        </div>

        {/* Selector rápido de día (4 al 14 nov) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {dates.map((d) => {
            const active = d === selectedDate;
            return (
              <Link
                key={d}
                href={`/admin/resultados?date=${d}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-xl border px-3 py-1.5 font-display text-xs font-bold transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-white text-ink hover:bg-warm"
                }`}
              >
                Día {getDayNumber(d)} · {d.slice(8, 10)} nov
              </Link>
            );
          })}
        </div>

        {/* Buscador (incluye código de ganador) */}
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="date" value={selectedDate} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por código (ej. 11D-7KQ2XM), nombre, correo o celular…"
            className="w-full max-w-md rounded-2xl border border-line bg-white px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-2xl bg-cta px-4 py-2.5 font-display text-xs font-extrabold uppercase text-white"
          >
            Buscar
          </button>
          {q && (
            <Link
              href={`/admin/resultados?date=${selectedDate}`}
              className="rounded-2xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold text-muted hover:text-ink"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Tabla de resultados */}
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-warm text-xs font-bold uppercase tracking-wider text-muted">
                <th className="px-3.5 py-3">#</th>
                <th className="px-3.5 py-3">Nombre</th>
                <th className="px-3.5 py-3">Correo</th>
                <th className="px-3.5 py-3">Celular</th>
                <th className="px-3.5 py-3">Estado</th>
                <th className="px-3.5 py-3">Motivo derrota</th>
                <th className="px-3.5 py-3 text-right">Vidas usadas</th>
                <th className="px-3.5 py-3">Letras usadas</th>
                <th className="px-3.5 py-3">Inicio (CO)</th>
                <th className="px-3.5 py-3">Fin (CO)</th>
                <th className="px-3.5 py-3 text-right">Duración</th>
                <th className="px-3.5 py-3">Código ganador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-sm text-muted">
                    No hay partidas registradas para este filtro.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const pos = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={r.play_id}
                      className={r.status === "won" ? "bg-sage/40 hover:bg-sage/70" : "hover:bg-bg/60"}
                    >
                      <td className="px-3.5 py-3 font-mono text-xs text-muted">{pos}</td>
                      <td className="px-3.5 py-3 font-semibold text-ink">{r.full_name}</td>
                      <td className="px-3.5 py-3 font-mono text-xs">{r.email}</td>
                      <td className="px-3.5 py-3 font-mono text-xs">{r.phone}</td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={r.status} />
                          <TitleBadge
                            status={titleStatus(r.email, r.game_date, r.status === "won", winners)}
                          />
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-xs text-muted">
                        {reasonLabel(r.lost_reason) || "—"}
                      </td>
                      <td className="px-3.5 py-3 text-right font-semibold tabular-nums">
                        {r.wrong_count}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-xs">
                        {r.guessed_letters.join(" ") || "—"}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-muted">
                        {formatDateTimeBogota(r.started_at)}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-muted">
                        {formatDateTimeBogota(r.finished_at) || "—"}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-xs tabular-nums">
                        {formatDuration(r.duration_ms) || "—"}
                      </td>
                      <td className="px-3.5 py-3 font-display text-xs font-extrabold tracking-wider text-primary-dark">
                        {r.win_code ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/resultados?date=${selectedDate}&q=${encodeURIComponent(q)}&page=${page - 1}`}
                  className="rounded-xl border border-line bg-white px-3 py-1.5 text-ink hover:bg-warm"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/resultados?date=${selectedDate}&q=${encodeURIComponent(q)}&page=${page + 1}`}
                  className="rounded-xl border border-line bg-white px-3 py-1.5 text-ink hover:bg-warm"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function TitleBadge({ status }: { status: TitleStatus }) {
  if (status.kind === "winner" || status.kind === "multi") {
    return (
      <span className="rounded-lg bg-[#F2C850] px-2 py-0.5 text-[11px] font-extrabold text-primary-dark">
        🏆 Ganador del día
      </span>
    );
  }
  if (status.kind === "already") {
    return (
      <span className="rounded-lg bg-warm px-2 py-0.5 text-[11px] font-bold text-muted">
        Ya ganó {describeTitle(status.titleDate)}
      </span>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "won") {
    return (
      <span className="rounded-full bg-primary px-2.5 py-0.5 font-display text-[11px] font-bold text-white">
        {statusLabel(status)}
      </span>
    );
  }
  if (status === "lost") {
    return (
      <span className="rounded-full bg-danger/15 px-2.5 py-0.5 font-display text-[11px] font-bold text-danger">
        {statusLabel(status)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-warm border border-line px-2.5 py-0.5 font-display text-[11px] font-bold text-muted">
      {statusLabel(status)}
    </span>
  );
}

export default function AdminResultadosPage(props: SearchProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Cargando resultados…</div>}>
      <ResultadosContent searchParams={props.searchParams} />
    </Suspense>
  );
}
