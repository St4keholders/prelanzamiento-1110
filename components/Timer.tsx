"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  /** Null when the game hasn't started yet (shows static limit). */
  deadlineAt: string | null;
  /** Server timestamp returned with the state, to compensate device clock skew. */
  serverNow: string;
  /** Seconds shown while stopped (the day's limit, e.g. 60). */
  timeLimitSeconds: number;
  /** Running only while status === 'playing'. */
  running: boolean;
  /** Called once when the countdown reaches 0. */
  onExpire?: () => void;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function initialSeconds(
  deadlineAt: string | null,
  serverNow: string,
  timeLimitSeconds: number,
  running: boolean,
): number {
  if (!running || !deadlineAt) return timeLimitSeconds;
  const diffMs = new Date(deadlineAt).getTime() - new Date(serverNow).getTime();
  return Math.max(0, Math.ceil(diffMs / 1000));
}

export function Timer({
  deadlineAt,
  serverNow,
  timeLimitSeconds,
  running,
  onExpire,
}: TimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running || !deadlineAt) return;
    const startedClientAt = Date.now();
    const baseRemainingMs =
      new Date(deadlineAt).getTime() - new Date(serverNow).getTime();
    let expiredFired = false;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedClientAt;
      setElapsedMs(elapsed);
      if (baseRemainingMs - elapsed <= 0 && !expiredFired) {
        expiredFired = true;
        window.clearInterval(interval);
        onExpire?.();
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
      setElapsedMs(0);
    };
  }, [deadlineAt, serverNow, running, onExpire]);

  const secondsLeft =
    !running || !deadlineAt
      ? initialSeconds(deadlineAt, serverNow, timeLimitSeconds, running)
      : Math.max(
          0,
          Math.ceil(
            (new Date(deadlineAt).getTime() -
              new Date(serverNow).getTime() -
              elapsedMs) /
              1000,
          ),
        );

  const danger = running && secondsLeft <= 10;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Tiempo restante ${formatClock(secondsLeft)}`}
      className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-1.5 font-display text-sm font-extrabold tabular-nums transition-colors ${
        danger
          ? "animate-pulse-soft border-danger/40 bg-danger/10 text-danger"
          : "border-line bg-white text-primary"
      }`}
    >
      <span aria-hidden="true">⏳</span>
      <span>{formatClock(secondsLeft)}</span>
    </div>
  );
}
