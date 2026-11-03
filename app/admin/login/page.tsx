"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Credenciales inválidas.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-4">
      <section className="w-full rounded-3xl border border-line bg-warm p-6 shadow-soft">
        <div className="mb-5 flex flex-col items-center text-center gap-2">
          <Image
            src="/logo.png"
            alt="11Diez"
            width={48}
            height={48}
            className="h-12 w-12 rounded-2xl object-contain"
          />
          <h1 className="font-display text-xl font-extrabold text-primary-dark">
            Administración · 11Diez
          </h1>
          <p className="text-xs text-muted">Ahorcadito Diario (4 al 14 de noviembre)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="admin-user" className="block text-xs font-bold text-ink mb-1">
              Usuario
            </label>
            <input
              id="admin-user"
              type="text"
              autoComplete="username"
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink"
            />
          </div>

          <div>
            <label htmlFor="admin-pass" className="block text-xs font-bold text-ink mb-1">
              Contraseña
            </label>
            <input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink"
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
            className="w-full rounded-2xl bg-primary px-5 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </div>
  );
}
