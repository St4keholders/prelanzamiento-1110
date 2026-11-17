"use client";

import { useState } from "react";
import { SquirrelFigure } from "@/components/teams/SquirrelFigure";
import {
  type LookPart,
  PARTS,
  composeLook,
  lookName,
  parseLook,
  randomLook,
} from "@/lib/squirrel-look";

const TABS: { key: LookPart; label: string }[] = [
  { key: "head", label: "🎩 Cabeza" },
  { key: "face", label: "🥸 Cara" },
  { key: "beard", label: "🧔 Barba" },
  { key: "hand", label: "🧮 Mano" },
];

/** Arma tu ardilla: vista previa + pestañas por capa + "Al azar" (como Fried Chicken). */
export function LookEditor({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (look: string) => void;
}) {
  const [tab, setTab] = useState<LookPart>("head");
  const look = parseLook(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-2xl border border-line p-1" style={{ backgroundColor: `${color}22` }}>
          <SquirrelFigure look={look} color={color} size={96} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold text-muted">
            Apariencia: <strong className="text-ink">{lookName(value)}</strong>
          </p>
          <button
            type="button"
            onClick={() => onChange(randomLook())}
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-primary-dark shadow-press active:translate-y-0.5"
          >
            🎲 Al azar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl border px-1 py-1.5 text-[11px] font-extrabold ${
              tab === t.key ? "border-primary bg-[#F2C850] text-primary-dark" : "border-line bg-white text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label={TABS.find((t) => t.key === tab)?.label}>
        {PARTS[tab].map((p) => {
          const preview = composeLook({ ...look, [tab]: p.id });
          const on = look[tab] === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              title={p.name}
              onClick={() => onChange(preview)}
              className={`flex flex-col items-center rounded-2xl border-2 p-1 ${
                on ? "border-primary bg-[#F2C850]" : "border-line bg-white hover:bg-warm"
              }`}
            >
              <SquirrelFigure
                look={preview}
                color={color}
                size={tab === "face" || tab === "beard" ? 78 : 64}
                crop={tab === "face" || tab === "beard" ? "head" : "full"}
              />
              <span className="text-center text-[10px] font-bold leading-tight text-ink">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
