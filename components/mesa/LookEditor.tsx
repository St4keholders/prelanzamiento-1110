"use client";

import { useState } from "react";
import { SquirrelFigure } from "@/components/teams/SquirrelFigure";
import {
  type LookPart,
  type Style,
  STYLES,
  composeLook,
  lookName,
  optionsFor,
  parseLook,
  randomLook,
  switchStyle,
} from "@/lib/squirrel-look";

type Tab = Exclude<LookPart, "style">;

function tabsFor(fem: boolean): { key: Tab; icon: string; label: string }[] {
  return [
    { key: "outfit", icon: fem ? "👗" : "👔", label: "Ropa" },
    { key: "head", icon: fem ? "🎀" : "🎩", label: "Cabeza" },
    { key: "face", icon: fem ? "😎" : "🥸", label: "Cara" },
    { key: "beard", icon: fem ? "💎" : "🧔", label: fem ? "Aretes" : "Barba" },
    { key: "hand", icon: fem ? "👜" : "🧮", label: "Mano" },
  ];
}

/** Arma tu ardilla: estilo + vista previa + pestañas por capa + "Al azar" (como Fried Chicken). */
export function LookEditor({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (look: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("head");
  const look = parseLook(value);
  const fem = look.style === "ardilla";
  const tabs = tabsFor(fem);
  const zoom = tab === "face" || tab === "beard";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-1" role="radiogroup" aria-label="Estilo">
        {STYLES.map((s) => {
          const on = look.style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(switchStyle(value, s.id as Style))}
              className={`rounded-xl px-2 py-1.5 text-sm font-extrabold ${
                on ? "bg-primary text-white" : "text-ink hover:bg-warm"
              }`}
            >
              {s.id === "ardilla" ? "🐿️ Ardilla" : "🐿️ Ardillo"}
            </button>
          );
        })}
      </div>

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
            onClick={() => onChange(randomLook(Math.random, look.style as Style))}
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-primary-dark shadow-press active:translate-y-0.5"
          >
            🎲 Al azar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-col items-center rounded-xl border px-0.5 py-1 text-[11px] font-extrabold leading-tight ${
              tab === t.key ? "border-primary bg-[#F2C850] text-primary-dark" : "border-line bg-white text-ink"
            }`}
          >
            <span aria-hidden className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="grid max-h-[22rem] grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4"
        role="radiogroup"
        aria-label={tabs.find((t) => t.key === tab)?.label}
      >
        {optionsFor(tab, look.style).map((p) => {
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
              <SquirrelFigure look={preview} color={color} size={zoom ? 78 : 64} crop={zoom ? "head" : "full"} />
              <span className="text-center text-[10px] font-bold leading-tight text-ink">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
