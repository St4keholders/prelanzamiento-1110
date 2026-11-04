import type { DayResult } from "@/lib/game-types";
import { progressText } from "@/lib/share-text";
import { formatLongDate, getDayNumber } from "@/lib/time";

const DOT_STYLE: Record<DayResult, string> = {
  won: "bg-[#F2C850] border-[#E2B73A]",
  lost: "bg-danger border-danger",
  playing: "bg-danger border-danger",
  missed: "bg-[#DCD5C3] border-[#DCD5C3]",
  future: "bg-white border-[#B9B2A3]",
};

const DOT_LABEL: Record<DayResult, string> = {
  won: "adivinada",
  lost: "no adivinada",
  playing: "no adivinada",
  missed: "no jugada",
  future: "por jugar",
};

interface StreakDotsProps {
  days: { date: string; result: DayResult }[];
  wonCount: number;
}

/** "Voy X de 11 palabras" + one dot per challenge day. */
export function StreakDots({ days, wonCount }: StreakDotsProps) {
  return (
    <div className="w-full space-y-2">
      <p className="font-display text-sm font-extrabold text-primary-dark">{progressText(wonCount)}</p>
      <ol className="flex flex-nowrap gap-[5px]" aria-label="Racha de los 11 días">
        {days.map((d) => (
          <li
            key={d.date}
            title={`Día ${getDayNumber(d.date)} · ${formatLongDate(d.date)}: ${DOT_LABEL[d.result]}`}
            className={`h-5 w-5 shrink-0 rounded-full border-2 ${DOT_STYLE[d.result]}`}
          >
            <span className="sr-only">
              Día {getDayNumber(d.date)}: {DOT_LABEL[d.result]}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-muted">
        <span className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full border ${DOT_STYLE.won}`} /> Adivinada
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full border ${DOT_STYLE.lost}`} /> No adivinada
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full border ${DOT_STYLE.missed}`} /> No jugada
        </span>
      </div>
    </div>
  );
}
