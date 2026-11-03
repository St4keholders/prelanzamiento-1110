import { describe, expect, it } from "vitest";
import {
  ALPHABET,
  buildMask,
  classifyGuesses,
  isSolved,
  isValidLetter,
  normalizeChar,
  normalizeText,
  wordLetters,
} from "@/lib/word";

describe("normalizeChar", () => {
  it("removes accents and keeps Ñ distinct", () => {
    expect(normalizeChar("á")).toBe("A");
    expect(normalizeChar("É")).toBe("E");
    expect(normalizeChar("í")).toBe("I");
    expect(normalizeChar("Ó")).toBe("O");
    expect(normalizeChar("ú")).toBe("U");
    expect(normalizeChar("ü")).toBe("U");
    expect(normalizeChar("Ü")).toBe("U");
    expect(normalizeChar("ñ")).toBe("Ñ");
    expect(normalizeChar("Ñ")).toBe("Ñ");
    expect(normalizeChar("n")).toBe("N");
  });
  it("matches SQL ahd_normalize output", () => {
    // Verified against Postgres: ahd_normalize('camión piña Ü') = 'CAMION PIÑA U'
    expect(normalizeText("camión piña Ü")).toBe("CAMION PIÑA U");
  });
});

describe("alphabet", () => {
  it("has 27 letters with Ñ after N", () => {
    expect(ALPHABET).toHaveLength(27);
    expect(ALPHABET.indexOf("Ñ")).toBe(ALPHABET.indexOf("N") + 1);
    expect(isValidLetter("Ñ")).toBe(true);
    expect(isValidLetter("á")).toBe(false);
    expect(isValidLetter("AB")).toBe(false);
  });
});

describe("wordLetters", () => {
  it("ignores spaces and symbols and normalizes", () => {
    // Verified against Postgres: ahd_word_letters('AÑO-NUEVO') = {A,E,N,Ñ,O,U,V}
    expect([...wordLetters("AÑO-NUEVO")].sort()).toEqual(["A", "E", "N", "O", "U", "V", "Ñ"].sort());
    expect([...wordLetters("RETENCIÓN EN LA FUENTE")].sort()).toEqual(
      ["A", "C", "E", "F", "I", "L", "N", "O", "R", "T", "U"].sort(),
    );
  });
});

describe("buildMask", () => {
  it("hides letters and shows symbols", () => {
    expect(buildMask("AÑO-NUEVO", [])).toEqual([
      [
        { kind: "letter", char: null },
        { kind: "letter", char: null },
        { kind: "letter", char: null },
        { kind: "symbol", char: "-" },
        { kind: "letter", char: null },
        { kind: "letter", char: null },
        { kind: "letter", char: null },
        { kind: "letter", char: null },
        { kind: "letter", char: null },
      ],
    ]);
  });

  it("splits phrases by word and reveals original accented chars", () => {
    const mask = buildMask("CAMIÓN DE CARGA", ["O", "A"]);
    expect(mask).toHaveLength(3);
    expect(mask[0].map((c) => c.char)).toEqual([null, "A", null, null, "Ó", null]);
    expect(mask[2].map((c) => c.char)).toEqual([null, "A", null, null, "A"]);
  });

  it("does not reveal N when guessing Ñ and vice versa", () => {
    expect(buildMask("PIÑA NUBE", ["N"]).flat().map((c) => c.char)).toEqual([
      null, null, null, null, "N", null, null, null,
    ]);
    expect(buildMask("PIÑA NUBE", ["Ñ"]).flat().map((c) => c.char)).toEqual([
      null, null, "Ñ", null, null, null, null, null,
    ]);
  });

  it("reveals Ü with U", () => {
    expect(buildMask("PINGÜINO", ["U"]).flat().map((c) => c.char)).toEqual([
      null, null, null, null, "Ü", null, null, null,
    ]);
  });

  it("ignores extra spaces", () => {
    expect(buildMask("  SOL   LUNA ", [])).toHaveLength(2);
  });
});

describe("isSolved / classifyGuesses", () => {
  it("detects victory with accents and symbols", () => {
    expect(isSolved("AÑO-NUEVO", ["A", "Ñ", "O", "N", "U", "E"])).toBe(false);
    expect(isSolved("AÑO-NUEVO", ["A", "Ñ", "O", "N", "U", "E", "V"])).toBe(true);
    expect(isSolved("RÍO", ["R", "I", "O"])).toBe(true);
  });
  it("classifies hits and misses", () => {
    expect(classifyGuesses("PIÑA", ["N", "P", "Z", "Ñ"])).toEqual({
      correct: ["P", "Ñ"],
      wrong: ["N", "Z"],
    });
  });
});
