"use client";

import { Countdown } from "@/components/Countdown";
import type { PublicBonus } from "@/lib/game-types";
import { formatDuration } from "@/lib/time";
import { describeTitle } from "@/lib/winner-rules";

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

interface BonusCardProps {
  bonus: PublicBonus;
  serverNow: string;
  onPlay: () => void;
  onShowImage: () => void;
  onRefresh: () => void;
}

/** Bonus round entry point / result, inside the waiting screen. */
export function BonusCard({ bonus, serverNow, onPlay, onShowImage, onRefresh }: BonusCardProps) {
  const secs = bonus.timeLimitSeconds;
  const minutes =
    secs % 60 === 0 ? `${secs / 60} ${secs === 60 ? "minuto" : "minutos"}` : `${secs} segundos`;
  const shortTime = secs % 60 === 0 ? `${secs / 60} min` : `${secs} s`;
  const play = bonus.play;
  const finished = play !== null && play.status !== "playing";

  return (
    <div className="rounded-3xl border-2 border-cta/70 bg-white p-4 shadow-soft space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[11px] font-extrabold uppercase tracking-wider text-cta">
            🎁 Ronda bonus · solo por hoy
          </p>
          <p className="font-display text-base font-extrabold text-primary-dark">
            {finished
              ? play.status === "won"
                ? bonus.result?.isWinner
                  ? "¡Ganaste la ronda bonus!"
                  : "¡Adivinaste la bonus!"
                : "Esta vez no fue"
              : "Una palabra extra para ti"}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-sage px-2 py-0.5 text-[11px] font-extrabold text-primary">
          {shortTime} · {bonus.maxErrors} vidas
        </span>
      </div>

      {bonus.window === "upcoming" && !play && (
        <>
          <p className="text-xs font-medium text-ink">
            Como ya jugaste la palabra de hoy, tienes una ronda extra con{" "}
            <strong>{minutes}</strong>. Se abre a las{" "}
            <strong>{timeFormatter.format(new Date(bonus.opensAt))}</strong> y puedes jugarla hasta
            la medianoche.
          </p>
          <Countdown
            targetIso={bonus.opensAt}
            serverNow={serverNow}
            onReachZero={onRefresh}
            label="Se abre en"
          />
        </>
      )}

      {bonus.window === "open" && !play && (
        <>
          <p className="text-xs font-medium text-ink">
            Como ya jugaste la palabra de hoy, tienes una palabra extra con{" "}
            <strong>{minutes}</strong>. Categoría: <strong>{bonus.category}</strong>. Una sola
            partida, hasta la medianoche.
          </p>
          <button
            type="button"
            onClick={onPlay}
            className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft active:translate-y-0.5"
          >
            Jugar ronda bonus
          </button>
        </>
      )}

      {finished && (
        <>
          <p className="text-xs font-medium text-ink">
            {play.status === "won"
              ? `La adivinaste en ${formatDuration(play.durationMs)}.`
              : play.lostReason === "timeout"
                ? "Se acabó el tiempo."
                : "Te quedaste sin vidas."}
          </p>

          {bonus.result?.isWinner ? (
            <p className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-3 py-2 text-center text-xs font-bold text-primary-dark">
              🏆 ¡Eres la persona ganadora de la ronda bonus!
            </p>
          ) : bonus.result?.winner ? (
            <p className="rounded-2xl border-2 border-[#E2B73A] bg-[#FDF3D2] px-3 py-2 text-center text-xs font-bold text-primary-dark">
              🏆 {bonus.result.winner.fullName} ganó la ronda bonus
              {bonus.result.winner.durationMs != null &&
                ` en ${formatDuration(bonus.result.winner.durationMs)}`}
              .
            </p>
          ) : null}

          {play.status === "won" && bonus.result?.titledDate && (
            <p className="text-[11px] font-semibold text-muted">
              Ya ganaste {describeTitle(bonus.result.titledDate)}. Cada persona puede ser ganadora
              una sola vez, así que este título es para otra persona.
            </p>
          )}

          <button
            type="button"
            onClick={onShowImage}
            className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-primary-dark shadow-soft"
          >
            Ver y compartir mi imagen bonus
          </button>
        </>
      )}
    </div>
  );
}
