import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PAGE_SIZE, getParticipantsPage } from "@/lib/admin";
import { isAdmin } from "@/lib/session";
import { formatDateTimeBogota } from "@/lib/time";

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

async function InscritosContent({ searchParams }: SearchProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { rows, total } = await getParticipantsPage(q, page);
  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary-dark">
              Participantes inscritos ({Number(total).toLocaleString("es-CO")})
            </h1>
            <p className="text-sm text-muted">
              Los números de celular repetidos en varios correos se resaltan para detectar posibles
              cuentas duplicadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/export?type=participants&format=xlsx"
              className="rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-white hover:bg-primary-dark"
            >
              ⬇ Exportar Excel (.xlsx)
            </a>
            <a
              href="/api/admin/export?type=participants&format=csv"
              className="rounded-xl border border-line bg-white px-3.5 py-2 font-display text-xs font-bold text-ink hover:bg-warm"
            >
              ⬇ Exportar CSV (; UTF-8)
            </a>
          </div>
        </div>

        {/* Buscador */}
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, correo o celular…"
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
              href="/admin/inscritos"
              className="rounded-2xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold text-muted hover:text-ink"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-warm text-xs font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Celular</th>
                <th className="px-4 py-3">Fecha registro (CO)</th>
                <th className="px-4 py-3">Último ingreso (CO)</th>
                <th className="px-4 py-3 text-right">Días jugados</th>
                <th className="px-4 py-3 text-right">Días ganados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                    No se encontraron participantes.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const dup = Number(r.phone_dup_count) > 1;
                  return (
                    <tr key={r.id} className={dup ? "bg-danger/5 hover:bg-danger/10" : "hover:bg-bg/60"}>
                      <td className="px-4 py-3 font-semibold text-ink">{r.full_name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="inline-flex items-center gap-1.5">
                          <span>{r.phone}</span>
                          {dup && (
                            <span
                              title={`Este celular aparece en ${r.phone_dup_count} correos registrados`}
                              className="rounded-full bg-danger px-2 py-0.5 font-sans text-[10px] font-bold text-white"
                            >
                              Repetido ({r.phone_dup_count})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDateTimeBogota(r.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDateTimeBogota(r.last_seen_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {Number(r.days_played)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary tabular-nums">
                        {Number(r.days_won)}
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
                  href={`/admin/inscritos?q=${encodeURIComponent(q)}&page=${page - 1}`}
                  className="rounded-xl border border-line bg-white px-3 py-1.5 text-ink hover:bg-warm"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/inscritos?q=${encodeURIComponent(q)}&page=${page + 1}`}
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

export default function AdminInscritosPage(props: SearchProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Cargando inscritos…</div>}>
      <InscritosContent searchParams={props.searchParams} />
    </Suspense>
  );
}
