"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/inscritos", label: "Inscritos" },
  { href: "/admin/resultados", label: "Resultados por día" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="11Diez"
              width={34}
              height={34}
              className="h-8.5 w-8.5 rounded-xl object-contain"
            />
            <div>
              <p className="font-display text-sm font-extrabold text-primary-dark leading-tight">
                Panel Admin · Ahorcadito Diario
              </p>
              <p className="text-[11px] font-medium text-muted">4 al 14 de noviembre de 2026</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navegación de administración">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3.5 py-2 font-display text-xs font-bold transition ${
                    active
                      ? "bg-primary text-white"
                      : "text-ink hover:bg-warm border border-transparent hover:border-line"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 rounded-xl border border-line bg-warm px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
