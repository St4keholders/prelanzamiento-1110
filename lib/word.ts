/**
 * Word normalization and mask. Must stay identical to the SQL functions
 * `ahd_normalize` / `ahd_word_letters` in supabase/migrations.
 */

export const ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "Ñ", "O", "P", "Q", "R", "S",
  "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export type Letter = (typeof ALPHABET)[number];

export type MaskCell =
  | { kind: "letter"; char: string | null } // null = hidden
  | { kind: "symbol"; char: string };
export type Mask = MaskCell[][];

const ACCENT_MAP: Record<string, string> = {
  á: "A", é: "E", í: "I", ó: "O", ú: "U", ü: "U",
  Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U", Ü: "U",
  ñ: "Ñ",
};

/** Á→A, É→E, Í→I, Ó→O, Ú→U, Ü→U; Ñ stays Ñ; uppercase. */
export function normalizeChar(ch: string): string {
  return (ACCENT_MAP[ch] ?? ch).toUpperCase();
}

export function normalizeText(text: string): string {
  return Array.from(text, normalizeChar).join("");
}

export function isLetter(ch: string): boolean {
  return /^[A-ZÑ]$/.test(normalizeChar(ch));
}

export function isValidLetter(value: string): value is Letter {
  return (ALPHABET as readonly string[]).includes(value);
}

/** Unique normalized letters that must be guessed. */
export function wordLetters(word: string): Set<string> {
  const set = new Set<string>();
  for (const ch of word) {
    const n = normalizeChar(ch);
    if (/^[A-ZÑ]$/.test(n)) set.add(n);
  }
  return set;
}

/** Mask by space-separated word. Revealed cells show the ORIGINAL character. */
export function buildMask(word: string, guessed: readonly string[]): Mask {
  const guessedSet = new Set(guessed.map(normalizeChar));
  return word
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) =>
      Array.from(chunk, (ch): MaskCell => {
        const n = normalizeChar(ch);
        if (/^[A-ZÑ]$/.test(n)) {
          return { kind: "letter", char: guessedSet.has(n) ? ch.toUpperCase() : null };
        }
        return { kind: "symbol", char: ch };
      }),
    );
}

export function isSolved(word: string, guessed: readonly string[]): boolean {
  const guessedSet = new Set(guessed.map(normalizeChar));
  for (const l of wordLetters(word)) if (!guessedSet.has(l)) return false;
  return true;
}

/** Which guessed letters are hits (for keyboard colors) — safe to send: only letters already played. */
export function classifyGuesses(word: string, guessed: readonly string[]) {
  const letters = wordLetters(word);
  const correct: string[] = [];
  const wrong: string[] = [];
  for (const g of guessed) (letters.has(normalizeChar(g)) ? correct : wrong).push(g);
  return { correct, wrong };
}
