"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ContactFields, contactFrom } from "@/components/mesa/ContactFields";
import { LookEditor } from "@/components/mesa/LookEditor";
import { DEFAULT_LOOK } from "@/lib/squirrel-look";
import type { MyContact } from "@/lib/team-types";

export function JoinClient({ code, color, me }: { code: string; color: string; me: MyContact }) {
  const router = useRouter();
  const [squirrel, setSquirrel] = useState(DEFAULT_LOOK);
  const [contact, setContact] = useState(() => contactFrom(me));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, code, squirrel }),
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
    <form onSubmit={join} className="space-y-3 rounded-3xl border border-line bg-white p-4 shadow-soft">
      <div>
        <p className="font-display text-base font-extrabold text-primary-dark">Tus datos</p>
        <p className="text-xs text-muted">Los necesitamos para confirmar tu puesto en el evento.</p>
      </div>
      <ContactFields email={me.email} askConsent={!me.dataConsent} value={contact} onChange={setContact} idPrefix="join" />
      <p className="text-xs font-bold text-ink">Arma tu ardilla</p>
      <LookEditor value={squirrel} color={color} onChange={setSquirrel} />
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft disabled:opacity-50"
      >
        {busy ? "Uniéndote…" : "Unirme a este team"}
      </button>
    </form>
  );
}
