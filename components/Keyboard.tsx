"use client";

import { useEffect } from "react";
import { type Letter, isValidLetter, normalizeChar } from "@/lib/word";

/** Spanish QWERTY layout (Ñ after L), like any phone or computer keyboard. */
export const QWERTY_ROWS: readonly (readonly Letter[])[] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

interface KeyboardProps {
  correctLetters: string[];
  wrongLetters: string[];
  disabled?: boolean;
  onSelect: (letter: Letter) => void;
}

export function Keyboard({
  correctLetters,
  wrongLetters,
  disabled = false,
  onSelect,
}: KeyboardProps) {
  const correctSet = new Set(correctLetters);
  const wrongSet = new Set(wrongLetters);

  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const normalized = normalizeChar(event.key);
      if (isValidLetter(normalized)) {
        if (correctSet.has(normalized) || wrongSet.has(normalized)) return;
        event.preventDefault();
        onSelect(normalized);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      className="flex w-full max-w-md mx-auto flex-col gap-1.5 select-none"
      role="group"
      aria-label="Teclado de letras"
    >
      {QWERTY_ROWS.map((row, r) => (
        <div key={r} className="flex justify-center gap-1">
          {row.map((letter) => {
            const isHit = correctSet.has(letter);
            const isMiss = wrongSet.has(letter);
            const isUsed = isHit || isMiss;

            let stateClass =
              "border-line bg-white text-ink shadow-press hover:bg-warm active:translate-y-0.5";
            if (isHit) {
              stateClass = "border-[#B8E2AE] bg-[#DDF2D8] text-primary-dark";
            } else if (isMiss) {
              stateClass = "border-[#F7C3C7] bg-[#FCE4E6] text-danger/70 opacity-60";
            }

            return (
              <button
                key={letter}
                type="button"
                disabled={disabled || isUsed}
                onClick={() => onSelect(letter)}
                aria-label={`Letra ${letter}${isHit ? ", correcta" : isMiss ? ", incorrecta" : ""}`}
                className={`flex min-h-[46px] w-[calc((100%-36px)/10)] max-w-[44px] items-center justify-center rounded-lg border font-display text-base font-bold transition-transform duration-150 disabled:cursor-not-allowed disabled:shadow-none ${stateClass}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
