"use client";

/** Casilla de autorización de la Política de Tratamiento de Datos (Ley 1581 de 2012). */
export function ConsentCheck({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-3">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-primary"
      />
      <label htmlFor={id} className="text-xs leading-snug text-ink">
        Acepto la{" "}
        <a
          href="/politica-de-datos"
          target="_blank"
          rel="noopener"
          className="font-bold text-primary underline"
        >
          Política de Tratamiento de Datos
        </a>{" "}
        y autorizo a 11Diez a usar mis datos para gestionar mi participación y enviarme novedades.
      </label>
    </div>
  );
}
