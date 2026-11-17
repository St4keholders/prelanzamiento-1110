"use client";

import type { MyContact } from "@/lib/team-types";

export interface Contact {
  fullName: string;
  phone: string;
  profession: string;
}

export function contactFrom(me: MyContact): Contact {
  return { fullName: me.fullName, phone: me.phone, profession: me.profession ?? "" };
}

const PROFESSIONS = [
  "Contador(a) público(a)",
  "Estudiante de contaduría",
  "Auxiliar contable",
  "Revisor(a) fiscal",
  "Auditor(a)",
  "Asesor(a) tributario(a)",
  "Administrador(a) de empresas",
  "Economista",
  "Financiero(a)",
  "Emprendedor(a)",
];

const input =
  "w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink";
const label = "mb-1 block text-xs font-bold text-ink";

/** Nombre completo, correo (solo lectura), teléfono y profesión. */
export function ContactFields({
  email,
  value,
  onChange,
  idPrefix = "c",
}: {
  email: string;
  value: Contact;
  onChange: (c: Contact) => void;
  idPrefix?: string;
}) {
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={label}>Nombre completo</label>
        <input
          id={`${idPrefix}-name`}
          className={input}
          required
          minLength={3}
          maxLength={120}
          autoComplete="name"
          value={value.fullName}
          onChange={set("fullName")}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-email`} className={label}>Correo</label>
        <input
          id={`${idPrefix}-email`}
          className="w-full cursor-not-allowed rounded-2xl border border-line bg-[#EFECE4] px-4 py-2.5 text-sm font-medium text-muted"
          value={email}
          readOnly
          aria-describedby={`${idPrefix}-email-note`}
        />
        <p id={`${idPrefix}-email-note`} className="mt-0.5 text-[11px] text-muted">
          Es el correo con el que entraste.
        </p>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-phone`} className={label}>Teléfono de contacto</label>
        <input
          id={`${idPrefix}-phone`}
          className={input}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={value.phone}
          onChange={set("phone")}
          placeholder="Ej. 300 123 4567"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-profession`} className={label}>Profesión</label>
        <input
          id={`${idPrefix}-profession`}
          className={input}
          required
          minLength={2}
          maxLength={80}
          list={`${idPrefix}-professions`}
          value={value.profession}
          onChange={set("profession")}
          placeholder="Ej. Contador(a) público(a)"
        />
        <datalist id={`${idPrefix}-professions`}>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
