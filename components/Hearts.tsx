"use client";

import Image from "next/image";

interface HeartsProps {
  livesLeft: number;
  maxLives?: number;
}

export function Hearts({ livesLeft, maxLives = 3 }: HeartsProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-warm px-3 py-1.5"
      role="status"
      aria-label={`${livesLeft} de ${maxLives} vidas restantes`}
    >
      {Array.from({ length: maxLives }, (_, idx) => {
        const full = idx < livesLeft;
        return (
          <Image
            key={idx}
            src={full ? "/heart-full.png" : "/heart-empty.png"}
            alt={full ? "Vida disponible" : "Vida perdida"}
            width={20}
            height={20}
            className={`h-5 w-5 object-contain transition-transform duration-200 ${
              full ? "scale-100" : "scale-90 opacity-60"
            }`}
          />
        );
      })}
    </div>
  );
}
