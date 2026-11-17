"use client";

import { useState } from "react";
import { ShareStep } from "@/components/ShareStep";

/** "Descargar / compartir mi imagen" → opens the share step for a server-generated PNG. */
export function ShareButton({
  src,
  fileName,
  label,
}: {
  src: string;
  fileName: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="rounded-3xl border border-line bg-white p-4 shadow-soft">
        <ShareStep src={src} fileName={fileName} won onDone={() => setOpen(false)} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft active:translate-y-0.5"
    >
      {label}
    </button>
  );
}
