"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetIso: string;
  serverNow: string;
  onReachZero?: () => void;
  label?: string;
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function splitMs(ms: number): Parts {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function Countdown({ targetIso, serverNow, onReachZero, label }: CountdownProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedClientAt = Date.now();
    const baseDiffMs = new Date(targetIso).getTime() - new Date(serverNow).getTime();
    let fired = false;

    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedClientAt;
      setElapsedMs(elapsed);
      if (baseDiffMs - elapsed <= 0 && !fired) {
        fired = true;
        window.clearInterval(id);
        onReachZero?.();
      }
    }, 500);

    return () => {
      window.clearInterval(id);
      setElapsedMs(0);
    };
  }, [targetIso, serverNow, onReachZero]);

  const baseDiffMs = new Date(targetIso).getTime() - new Date(serverNow).getTime();
  const diff = Math.max(0, baseDiffMs - elapsedMs);
  const { days, hours, minutes, seconds } = splitMs(diff);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      )}
      <div
        className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 shadow-soft"
        role="timer"
        aria-live="off"
      >
        {days > 0 && (
          <>
            <TimeUnit value={days.toString()} unit={days === 1 ? "día" : "días"} />
            <span className="font-display text-lg font-extrabold text-primary">:</span>
          </>
        )}
        <TimeUnit value={pad(hours)} unit="h" />
        <span className="font-display text-lg font-extrabold text-primary">:</span>
        <TimeUnit value={pad(minutes)} unit="m" />
        <span className="font-display text-lg font-extrabold text-primary">:</span>
        <TimeUnit value={pad(seconds)} unit="s" />
      </div>
    </div>
  );
}

function TimeUnit({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="flex items-baseline gap-0.5 tabular-nums">
      <span className="font-display text-xl font-extrabold text-primary-dark sm:text-2xl">
        {value}
      </span>
      <span className="text-xs font-bold text-muted">{unit}</span>
    </div>
  );
}
