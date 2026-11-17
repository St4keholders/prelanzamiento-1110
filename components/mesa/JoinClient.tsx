"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SquirrelPicker } from "@/components/mesa/Pickers";

export function JoinClient({ code }: { code: string }) {
  const router = useRouter();
  const [squirrel, setSquirrel] = useState("clasica");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, squirrel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No pudimos unirte al team.");
        router.refresh();
        return;
      }
      router.push("/mesa");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-3xl border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-bold text-ink">Escoge tu ardilla</p>
      <SquirrelPicker value={squirrel} onChange={setSquirrel} />
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <button
        type="button"
        onClick={join}
        disabled={busy}
        className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft disabled:opacity-50"
      >
        {busy ? "Uniéndote…" : "Unirme a este team"}
      </button>
    </section>
  );
}
