"use client";

export type SoundKind = "correct" | "incorrect" | "game-over" | "level-success";

const SOUND_FILES: Record<SoundKind, string> = {
  correct: "/sounds/sfx-correct.wav",
  incorrect: "/sounds/sfx-incorrect.wav",
  "game-over": "/sounds/sfx-game-over.wav",
  "level-success": "/sounds/sfx-level-success.wav",
};

const cache = new Map<SoundKind, HTMLAudioElement>();

export function playSound(kind: SoundKind): void {
  if (typeof window === "undefined") return;
  try {
    let audio = cache.get(kind);
    if (!audio) {
      audio = new Audio(SOUND_FILES[kind]);
      audio.preload = "auto";
      cache.set(kind, audio);
    }
    audio.currentTime = 0;
    audio.volume = 0.55;
    void audio.play().catch(() => {
      // Autoplay blocked or audio unavailable; ignore silently.
    });
  } catch {
    // Ignore audio errors on unsupported environments.
  }
}
