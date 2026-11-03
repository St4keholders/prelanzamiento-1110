"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

interface RegisterFormProps {
  onAuthenticated: () => void;
}

export function RegisterForm({ onAuthenticated }: RegisterFormProps) {
  const [step, setStep] = useState<"email" | "profile">("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError("Escribe tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Revisa tu correo e inténtalo de nuevo.");
        return;
      }
      setEmail(clean);
      if (data.exists) {
        onAuthenticated();
      } else {
        setStep("profile");
      }
    } catch {
      setError("No pudimos conectarnos. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Revisa tus datos e inténtalo de nuevo.");
        return;
      }
      onAuthenticated();
    } catch {
      setError("No pudimos conectarnos. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-enter w-full rounded-3xl border border-line bg-warm p-5 sm:p-6 shadow-soft">
      <div className="flex flex-col items-center text-center gap-2 mb-5">
        <Image
          src="/mascot-waving.png"
          alt="Mascota 11Diez saludando"
          width={76}
          height={76}
          priority
          className="h-19 w-19 object-contain"
        />
        <span className="rounded-full bg-sage border border-[#D4DEAF] px-3 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider text-primary">
          4 al 14 de noviembre · 11 días
        </span>
        <h1 className="font-display text-2xl font-extrabold text-primary-dark">
          Ahorcadito Diario 11Diez
        </h1>
        <p className="text-sm text-muted max-w-xs">
          {step === "email"
            ? "Ingresa con tu correo para jugar la palabra del día."
            : "Completa tus datos una sola vez para quedar inscrito en el reto."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-ink mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink placeholder:text-muted/60 focus:border-primary"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cta px-5 py-3.5 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft transition hover:brightness-95 active:translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-3.5 py-2 text-xs">
            <span className="truncate font-semibold text-ink">{email}</span>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="font-bold text-primary underline ml-2 shrink-0"
            >
              Cambiar
            </button>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-xs font-bold text-ink mb-1">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. María Fernanda Gómez"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink placeholder:text-muted/60 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-ink mb-1">
              Número de celular
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 3001234567"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink placeholder:text-muted/60 focus:border-primary"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cta px-5 py-3.5 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft transition hover:brightness-95 active:translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Inscribiendo..." : "Empezar"}
          </button>
        </form>
      )}
    </section>
  );
}
