import { describe, expect, it } from "vitest";
import {
  bonusShareTexts,
  dayPillText,
  livesLeftText,
  lostLivesText,
  progressText,
  revengeText,
  shareTitle,
  shareVariant,
  winnerBadge,
} from "@/lib/share-text";

describe("share text", () => {
  it("picks the right variant", () => {
    expect(shareVariant("won", null, true)).toBe("winner");
    expect(shareVariant("won", null, false)).toBe("won");
    expect(shareVariant("lost", "errors", false)).toBe("lost-errors");
    expect(shareVariant("lost", "timeout", false)).toBe("lost-timeout");
  });

  it("formats titles and labels", () => {
    expect(dayPillText(1, "2026-11-04")).toBe("DÍA 1 DE 11 · 4 NOV 2026");
    expect(dayPillText(11, "2026-11-14")).toBe("DÍA 11 DE 11 · 14 NOV 2026");
    expect(shareTitle("winner")).toBe("¡Gané el día!");
    expect(shareTitle("winner", true, 1)).toBe("¡Gané el día 1!");
    expect(winnerBadge(true)).toBe("+25 NUECES EN LA APP 1110");
    expect(winnerBadge(false)).toBe("GANADOR DEL DÍA");
    expect(shareTitle("won")).toBe("¡Lo logré!");
    expect(shareTitle("lost-errors")).toBe("Hoy no adiviné");
    expect(shareTitle("lost-timeout")).toBe("Se me acabó el tiempo");
    expect(livesLeftText(1)).toBe("Me quedó 1 vida");
    expect(livesLeftText(3)).toBe("Me quedaron 3 vidas");
    expect(lostLivesText("lost-errors", 0)).toBe("0 vidas");
    expect(lostLivesText("lost-timeout", 1)).toBe("Me quedaba 1 vida");
    expect(lostLivesText("lost-timeout", 2)).toBe("Me quedaban 2 vidas");
    expect(revengeText(false)).toBe("Pero mañana vuelvo por la revancha.");
    expect(revengeText(true)).toBe("Fue el último día del reto.");
    expect(progressText(0)).toBe("Voy 0 de 11 palabras");
    expect(progressText(1)).toBe("Voy 1 de 11 palabras");
  });
});

describe("bonus share texts", () => {
  it("formats the bonus pill and title", () => {
    expect(bonusShareTexts("2026-11-06")).toEqual({
      pill: "RONDA BONUS · 6 NOV 2026",
      title: "¡Gané la ronda bonus!",
      badge: "GANADOR RONDA BONUS",
    });
  });
});
