import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Common frame for the post-game pages (same look as the game). */
export function Shell({
  title = "1110 · Prelanzamiento",
  back,
  children,
}: {
  title?: string;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-3.5 py-3">
      <header className="flex items-center justify-between gap-2 pb-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="11Diez"
            width={34}
            height={34}
            priority
            className="h-8.5 w-8.5 rounded-xl object-contain"
          />
          <span className="font-display text-sm font-extrabold tracking-tight text-primary-dark">
            {title}
          </span>
        </Link>
        {back && (
          <Link
            href={back.href}
            className="text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            ← {back.label}
          </Link>
        )}
      </header>
      <main className="flex w-full flex-1 flex-col gap-3 pb-6">{children}</main>
    </div>
  );
}

export function Card({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode;
  tone?: "white" | "warm" | "sage";
  className?: string;
}) {
  const bg = tone === "warm" ? "bg-warm" : tone === "sage" ? "bg-sage" : "bg-white";
  return (
    <section className={`rounded-3xl border border-line ${bg} p-4 shadow-soft ${className}`}>
      {children}
    </section>
  );
}
