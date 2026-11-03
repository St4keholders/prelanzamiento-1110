"use client";

import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import type { PublicDay, PublicPlay } from "@/lib/game-types";
import { TOTAL_DAYS, formatLongDate } from "@/lib/time";

interface LoseCardProps {
  day: PublicDay;
  play: PublicPlay;
  serverNow: string;
  nextWordAt: string;
  onNextDayReady: () => void;
}

export function LoseCard({
  day,
  play,
  serverNow,
  nextWordAt,
  onNextDayReady,
}: LoseCardProps) {
  const byTimeout = play.lostReason === "timeout";

  return (
    <section
      aria-label="Resultado de la partida"
      className="animate-enter w-full rounded-3xl border border-[#F7C3C7] bg-warm p-5 shadow-soft flex flex-col items-center text-center gap-3.5"
    >
      <Image
        src="/mascot-avatar-sad.png"
        alt="Mascota 11Diez triste"
        width={72}
        height={72}
        priority
        className="h-18 w-18 object-contain"
      />

      <span className="inline-block rounded-full border border-line bg-white px-3 py-0.5 font-display text-xs font-bold text-muted">
        Día {day.number} de {TOTAL_DAYS} · {formatLongDate(day.date)}
      </span>

      <div className="space-y-1">
        <h1 className="font-display text-xl font-extrabold text-danger">
          Esta vez no fue
        </h1>
        <p className="text-sm font-medium text-ink">
          {byTimeout
            ? "Se agotaron los 2 minutos de tiempo."
            : "Agotaste tus 3 vidas en la palabra de hoy."}
        </p>
      </div>

      {day.isLastDay ? (
        <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
          Hoy era el último día del reto. ¡Muchas gracias por participar!
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Vuelve mañana a las <strong className="text-ink">12:00 AM (hora Colombia)</strong> por
            una nueva palabra.
          </p>
          <Countdown
            targetIso={nextWordAt}
            serverNow={serverNow}
            onReachZero={onNextDayReady}
            label="Próxima palabra en"
          />
        </>
      )}
    </section>
  );
}
