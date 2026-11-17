"use client";

import { Flag } from "@/components/teams/Art";
import { FLAGS, TEAM_COLORS, colorHex } from "@/lib/teams-catalog";

const pick = (on: boolean) =>
  on ? "border-primary bg-sage ring-2 ring-primary" : "border-line bg-white hover:bg-warm";

export function FlagPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Bandera del team">
      {FLAGS.map((f) => (
        <button
          key={f.key}
          type="button"
          role="radio"
          aria-checked={value === f.key}
          onClick={() => onChange(f.key)}
          className={`flex flex-col items-center rounded-2xl border p-1 ${pick(value === f.key)}`}
        >
          <Flag kind={f.key} color={colorHex(color)} size={64} />
          <span className="text-center text-[10px] font-bold leading-tight text-ink">{f.name}</span>
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color del team">
      {TEAM_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          role="radio"
          aria-checked={value === c.key}
          aria-label={c.name}
          title={c.name}
          onClick={() => onChange(c.key)}
          className={`h-9 w-9 rounded-full border-4 ${value === c.key ? "border-ink" : "border-white"} shadow-soft`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}
