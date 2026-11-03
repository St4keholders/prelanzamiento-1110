"use client";

import type { Mask } from "@/lib/word";

interface BoardProps {
  mask: Mask;
}

/**
 * Responsive word slots:
 * - Each word of the phrase renders on its own row (`mask` is grouped by word).
 * - Scales down cell width & font size when the longest word has > 8 or > 10 chars
 *   so it fits inside a 360px screen without horizontal scroll.
 */
export function Board({ mask }: BoardProps) {
  const longest = mask.reduce((max, row) => Math.max(max, row.length), 0);

  let boxClass = "w-9 h-11 text-lg rounded-xl gap-1.5";
  let rowGap = "gap-1.5";
  if (longest > 12) {
    boxClass = "w-[22px] h-8 text-xs rounded-lg";
    rowGap = "gap-1";
  } else if (longest > 10) {
    boxClass = "w-6 h-9 text-sm rounded-lg";
    rowGap = "gap-1";
  } else if (longest > 8) {
    boxClass = "w-7 h-10 text-base rounded-xl";
    rowGap = "gap-1";
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2.5 py-2 w-full max-w-full overflow-hidden"
      aria-label="Tablero de la palabra secreta"
    >
      {mask.map((wordCells, wordIdx) => (
        <div
          key={wordIdx}
          className={`flex flex-nowrap items-center justify-center ${rowGap} max-w-full`}
          role="group"
          aria-label={`Palabra ${wordIdx + 1} de ${mask.length}, ${wordCells.length} casillas`}
        >
          {wordCells.map((cell, cellIdx) => {
            if (cell.kind === "symbol") {
              return (
                <span
                  key={cellIdx}
                  className="px-0.5 font-display text-base font-extrabold text-primary-dark"
                >
                  {cell.char}
                </span>
              );
            }
            const revealed = cell.char !== null;
            return (
              <div
                key={cellIdx}
                aria-label={revealed ? `Letra ${cell.char}` : "Letra oculta"}
                className={`flex shrink-0 items-center justify-center border-[1.5px] font-display font-extrabold select-none transition-colors ${boxClass} ${
                  revealed
                    ? "animate-pop border-[#D4DEAF] bg-lime text-ink"
                    : "border-line bg-white text-ink"
                }`}
              >
                {cell.char ?? ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
