"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Countdown } from "@/components/Countdown";
import { StreakDots } from "@/components/StreakDots";
import type { PlayResult, PublicDay, PublicPlay } from "@/lib/game-types";
import { NUECES_BONUS_TEXT } from "@/lib/share-text";
import { TOTAL_DAYS, formatDuration, formatLongDate, getDayNumber } from "@/lib/time";

const REFRESH_MS = 60_000;

interface WaitingViewProps {
  day: PublicDay;
  play: PublicPlay;
  result: PlayResult;
  serverNow: string;
  nextWordAt: string;
  isToday: boolean;
  onShowImage: () => void;
  onRefresh: () => void;
}

/** After the play of the day: result, winner announcement, streak and countdown. */
export function WaitingView({
  day,
  play,
  result,
  serverNow,
  nextWordAt,
  isToday,
  onShowImage,
  onRefresh,
}: WaitingViewProps) {
  // Refresh every minute so the "someone already won" announcement shows up.
  useEffect(() => {
    const id = window.setInterval(onRefresh, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [onRefresh]);

  const won = play.status === "won";
  const title = won
    ? result.isDayWinner
      ? result.multiWinnerDay
        ? `¡Ganaste el Día ${day.number}!`
        : "¡Ganaste el día!"
      : "¡Lo lograste!"
    : play.lostReason === "timeout"
      ? "Se acabó el tiempo"
      : "Hoy no fue";
  const subtitle = won
    ? `Adivinaste la palabra en ${formatDuration(play.durationMs)}.`
    : play.lostReason === "timeout"
      ? "Se agotaron los 2 minutos."
      : "Te quedaste sin vidas.";

  return (
    <section aria-label="Tu resultado de hoy" className="animate-enter w-full space-y-3">
      <div
        className={`rounded-3xl border p-4 shadow-soft flex items-center gap-3 ${
          won ? "border-[#D4DEAF] bg-sage" : "border-line bg-warm"
        }`}
      >
        <Image
          src={won ? "/mascot-avatar-happy.png" : "/mascot-avatar-sad.png"}
          alt=""
          width={64}
          height={64}
          priority
          className="h-16 w-16 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-primary">
            Día {day.number} de {TOTAL_DAYS} · {formatLongDate(day.date)}
          </p>
          <h1
            className={`font-display text-xl font-extrabold leading-tight ${
              won ? "text-primary-dark" : "text-danger"
            }`}
          >
            {title}
          </h1>
          <p className="text-xs font-medium text-ink">{subtitle}</p>
        </div>
      </div>

      {/* Premio / anuncio del ganador del día */}
      {result.multiWinnerDay ? (
        result.isDayWinner && (
          <p role="status" className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-4 py-3 text-center text-sm font-bold text-primary-dark">
            🎁 ¡Todos los que adivinan el Día {day.number} ganan! {NUECES_BONUS_TEXT}
          </p>
        )
      ) : result.isDayWinner ? (
        <p role="status" className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-4 py-3 text-center text-sm font-bold text-primary-dark">
          🏆 ¡Eres la persona ganadora {isToday ? "de hoy" : `del Día ${day.number}`}!
        </p>
      ) : result.dayWinner ? (
        <p role="status" className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-4 py-3 text-center text-sm font-bold text-primary-dark">
          🏆 {result.dayWinner.fullName} ganó {isToday ? "hoy" : `el Día ${day.number}`}
          {result.dayWinner.durationMs != null && ` en ${formatDuration(result.dayWinner.durationMs)}`}.
        </p>
      ) : null}

      {won && result.titledDate && (
        <p className="rounded-2xl border border-line bg-white px-4 py-2.5 text-center text-xs font-semibold text-ink">
          Ya ganaste el Día {getDayNumber(result.titledDate)}. Cada persona puede ser ganadora una
          sola vez, así que el título de este día es para otra persona. ¡Igual suma a tu racha!
        </p>
      )}

      <div className="rounded-3xl border border-line bg-white p-4 shadow-soft">
        <StreakDots days={result.days} wonCount={result.wonCount} />
      </div>

      <div className="rounded-3xl border border-line bg-warm p-4 shadow-soft flex flex-col items-center text-center gap-2">
        {day.isLastDay ? (
          <p className="text-sm font-semibold text-ink">
            Hoy era el último día del reto. ¡Muchas gracias por participar!
          </p>
        ) : isToday ? (
          <Countdown
            targetIso={nextWordAt}
            serverNow={serverNow}
            onReachZero={onRefresh}
            label="Próxima palabra en"
          />
        ) : (
          <button
            type="button"
            onClick={onRefresh}
            className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-xs font-extrabold uppercase tracking-wide text-white shadow-soft"
          >
            Jugar la palabra de hoy
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onShowImage}
        className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-primary-dark shadow-soft"
      >
        Ver y compartir mi imagen
      </button>
    </section>
  );
}
