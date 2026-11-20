"use client";

import { Flag } from "@/components/teams/Art";
import type { PublicEvent } from "@/lib/team-types";
import { colorHex, TABLES } from "@/lib/teams-catalog";

/** Ocupación de una mesa pública según el evento. */
export function seatsOf(event: PublicEvent, n: number): { used: number; names: string[] } {
  const t = event.tables.find((x) => x.number === n);
  return { used: t?.seatsUsed ?? 0, names: t?.names ?? [] };
}

/** Mesas públicas con algún puesto libre (sin contar la propia). */
export function freeTables(event: PublicEvent, current: number | null = null): number {
  return TABLES.filter(
    (t) => t.number <= event.tableCount && t.number !== current && seatsOf(event, t.number).used < event.seatsPerTable,
  ).length;
}

/** Las mesas con su bandera, cupos y quiénes ya están. */
export function TablePicker({
  event,
  value,
  onChange,
  current = null,
}: {
  event: PublicEvent;
  value: number | null;
  onChange: (n: number) => void;
  /** Mesa en la que ya está (no se puede escoger). */
  current?: number | null;
}) {
  const tables = TABLES.filter((t) => t.number <= event.tableCount);
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mesas">
      {tables.map((t) => {
        const { used, names } = seatsOf(event, t.number);
        const full = used >= event.seatsPerTable;
        const mine = t.number === current;
        const disabled = full || mine;
        const on = value === t.number;
        return (
          <button
            key={t.number}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(t.number)}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center ${
              disabled
                ? "cursor-not-allowed border-line bg-warm opacity-50"
                : on
                  ? "border-primary bg-[#F2C850]"
                  : "border-line bg-white hover:bg-warm"
            }`}
          >
            <Flag kind={t.flag} color={colorHex(t.color)} size={60} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Mesa {t.number}</span>
            <span className="text-sm font-extrabold leading-tight text-ink">{t.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                full ? "bg-danger/10 text-danger" : "bg-sage text-primary"
              }`}
            >
              {mine ? "Tu mesa" : full ? "Llena" : `${used} de ${event.seatsPerTable}`}
            </span>
            <span className="line-clamp-2 min-h-[2lh] text-[11px] leading-snug text-muted">
              {used === 0 ? "Vacía: quien llegue primero es el capitán" : names.join(", ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
