import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  currentWindow,
  isStartEditable,
  schedulePhase,
  startAt,
  toHHMM,
} from "@/lib/schedule";

const bog = (s: string) => new Date(`${s}-05:00`);

// Como quedó en la base: 4–10 nov a medianoche, 11–14 nov a las 12:00 p. m.
const rows = [
  ...["04", "05", "06", "07", "08", "09", "10"].map((d) => ({
    game_date: `2026-11-${d}`,
    starts_at: bog(`2026-11-${d}T00:00:00`).toISOString(),
  })),
  ...["11", "12", "13", "14"].map((d) => ({
    game_date: `2026-11-${d}`,
    starts_at: bog(`2026-11-${d}T12:00:00`).toISOString(),
  })),
];
const s = buildSchedule(rows);
const at = (t: string) => currentWindow(s, bog(t))?.date ?? null;

describe("schedule", () => {
  it("each word runs until the next one starts", () => {
    expect(at("2026-11-10T14:00:00")).toBe("2026-11-10");
    expect(at("2026-11-11T00:30:00")).toBe("2026-11-10"); // la del 10 sigue abierta
    expect(at("2026-11-11T11:59:59")).toBe("2026-11-10");
    expect(at("2026-11-11T12:00:00")).toBe("2026-11-11");
    expect(at("2026-11-12T11:00:00")).toBe("2026-11-11");
  });

  it("the last word stays open 24 h, then the challenge ends", () => {
    expect(at("2026-11-15T11:59:00")).toBe("2026-11-14");
    expect(at("2026-11-15T12:00:00")).toBeNull();
    expect(schedulePhase(s, bog("2026-11-15T12:00:00"))).toBe("ended");
    expect(schedulePhase(s, bog("2026-11-03T23:59:00"))).toBe("before");
    expect(schedulePhase(s, bog("2026-11-04T00:00:00"))).toBe("active");
  });

  it("days without a row start at midnight", () => {
    const partial = buildSchedule(rows.filter((r) => r.game_date !== "2026-11-12"));
    expect(currentWindow(partial, bog("2026-11-12T08:00:00"))?.date).toBe("2026-11-12");
  });

  it("edit lock and time helpers", () => {
    const start = startAt("2026-11-11", "12:00");
    expect(start.toISOString()).toBe("2026-11-11T17:00:00.000Z");
    expect(toHHMM(start)).toBe("12:00");
    expect(isStartEditable(start, bog("2026-11-11T11:59:00"))).toBe(true);
    expect(isStartEditable(start, bog("2026-11-11T12:00:00"))).toBe(false);
  });
});
