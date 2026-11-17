"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Accepts the bare code ("K7Q2XM") or the full link (".../m/K7Q2XM"). */
export function JoinCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const code = value.trim().split("/").filter(Boolean).pop()?.toUpperCase() ?? "";
        if (!/^[A-Z0-9]{4,10}$/.test(code)) {
          setError("Escribe el código de 6 caracteres o pega el enlace que te pasó el capitán.");
          return;
        }
        router.push(`/m/${code}`);
      }}
    >
      <input
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-center font-display text-lg font-extrabold uppercase tracking-widest text-ink"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="CÓDIGO"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-label="Código del team"
      />
      {error && <p className="text-xs font-bold text-danger">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft"
      >
        Buscar team
      </button>
    </form>
  );
}
