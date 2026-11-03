"use client";

import Image from "next/image";
import { Hearts } from "@/components/Hearts";
import type { PublicDay, PublicPlay, PublicPlayer } from "@/lib/game-types";
import {
  TOTAL_DAYS,
  formatDuration,
  formatLongDate,
  formatTimeBogota,
} from "@/lib/time";

interface WinCardProps {
  player: PublicPlayer;
  day: PublicDay;
  play: PublicPlay;
}

/**
 * Designed to fit completely inside a single 360x740 mobile screenshot.
 * Never displays the secret word nor mentions Instagram / where to send it.
 */
export function WinCard({ player, day, play }: WinCardProps) {
  return (
    <section
      aria-label="Resultado de victoria"
      className="animate-enter w-full rounded-3xl border-2 border-[#D4DEAF] bg-sage p-4 shadow-soft flex flex-col items-center text-center gap-2.5"
    >
      <div className="flex items-center gap-2.5">
        <Image
          src="/mascot-avatar-happy.png"
          alt="Mascota 11Diez celebrando"
          width={56}
          height={56}
          priority
          className="h-14 w-14 object-contain"
        />
        <div className="text-left">
          <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider text-white">
            Día {day.number} de {TOTAL_DAYS} · {formatLongDate(day.date)}
          </span>
          <h1 className="font-display text-xl font-extrabold text-primary-dark leading-tight mt-0.5">
            ¡Lo lograste!
          </h1>
        </div>
      </div>

      {/* Código único grande y legible */}
      <div className="w-full rounded-2xl border-2 border-primary/25 bg-white px-3 py-2.5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Código único de ganador
        </p>
        <p
          data-testid="win-code"
          className="mt-0.5 font-display text-2xl sm:text-3xl font-extrabold tracking-widest text-primary-dark select-all"
        >
          {play.winCode}
        </p>
      </div>

      {/* Datos del participante y de la partida */}
      <div className="w-full rounded-2xl border border-line bg-white/90 px-3.5 py-2.5 text-left text-xs space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-muted">Participante</span>
          <span className="font-bold text-ink truncate max-w-[65%]">{player.fullName}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-muted">Correo</span>
          <span className="font-mono font-semibold text-ink">{player.maskedEmail}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-muted">Hora (Colombia)</span>
          <span className="font-bold text-ink">
            {play.finishedAt ? formatTimeBogota(play.finishedAt) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-muted">Tiempo empleado</span>
          <span className="font-bold text-ink">{formatDuration(play.durationMs)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="font-medium text-muted">Vidas restantes</span>
          <Hearts livesLeft={play.livesLeft} maxLives={day.maxErrors} />
        </div>
      </div>

      <p className="text-xs font-semibold text-primary-dark">
        📸 Toma captura de pantalla a esta tarjeta para guardar tu comprobante de hoy.
      </p>
    </section>
  );
}
