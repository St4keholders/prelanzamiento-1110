import { describe, expect, it } from "vitest";
import { type WonPlay, describeTitle, pickDayWinners, titleStatus } from "@/lib/winner-rules";

let n = 0;
const won = (participantId: string, gameDate: string, time: string): WonPlay => ({
  id: `id-${++n}`,
  participantId,
  gameDate,
  finishedAt: `${gameDate}T${time}-05:00`,
  durationMs: 60_000,
});

const keyed = (m: ReturnType<typeof pickDayWinners>) =>
  new Map([...m].map(([d, w]) => [d, { key: w.participantId }]));

describe("pickDayWinners", () => {
  it("ignores Día 1 (everyone wins that day)", () => {
    const w = pickDayWinners([won("angie", "2026-11-04", "00:01:00"), won("ana", "2026-11-04", "00:00:30")]);
    expect(w.size).toBe(0);
  });

  it("picks the first to finish from Día 2 on", () => {
    const w = pickDayWinners([
      won("luis", "2026-11-05", "08:00:00"),
      won("angie", "2026-11-05", "00:02:00"),
    ]);
    expect(w.get("2026-11-05")?.participantId).toBe("angie");
  });

  it("Día 1 winners can still win the title later", () => {
    const w = pickDayWinners([
      won("angie", "2026-11-04", "00:01:00"),
      won("angie", "2026-11-05", "00:02:00"),
    ]);
    expect(w.get("2026-11-05")?.participantId).toBe("angie");
  });

  it("one title per person: the next eligible player gets it", () => {
    const w = pickDayWinners([
      won("angie", "2026-11-05", "00:02:00"),
      won("angie", "2026-11-06", "00:01:00"), // fastest, but already holds Día 2
      won("luis", "2026-11-06", "00:03:00"),
      won("angie", "2026-11-07", "00:01:00"),
      won("luis", "2026-11-07", "00:02:00"), // already holds Día 3
    ]);
    expect(w.get("2026-11-05")?.participantId).toBe("angie");
    expect(w.get("2026-11-06")?.participantId).toBe("luis");
    expect(w.has("2026-11-07")).toBe(false); // nobody eligible guessed it
  });

  it("orders by finish time, not by input order", () => {
    const w = pickDayWinners([
      won("b", "2026-11-08", "10:00:00"),
      won("a", "2026-11-08", "09:59:59"),
    ]);
    expect(w.get("2026-11-08")?.participantId).toBe("a");
  });
});

describe("titleStatus", () => {
  const winners = keyed(
    pickDayWinners([won("angie", "2026-11-05", "00:02:00"), won("luis", "2026-11-06", "00:03:00")]),
  );

  it("Día 1: everyone who guessed is a winner", () => {
    expect(titleStatus("x", "2026-11-04", true, winners)).toEqual({ kind: "multi" });
    expect(titleStatus("x", "2026-11-04", false, winners)).toEqual({ kind: "none" });
  });

  it("detects the official winner and blocked players", () => {
    expect(titleStatus("angie", "2026-11-05", true, winners)).toEqual({ kind: "winner" });
    expect(titleStatus("angie", "2026-11-06", true, winners)).toEqual({
      kind: "already",
      titleDate: "2026-11-05",
    });
    expect(titleStatus("luis", "2026-11-05", true, winners)).toEqual({ kind: "none" });
    expect(titleStatus("angie", "2026-11-06", false, winners)).toEqual({ kind: "none" });
  });
});

describe("bonus round", () => {
  it("counts as one more title, evaluated right after the word of its day", () => {
    const w = pickDayWinners([
      won("ana", "2026-11-06", "08:00:00"), // gana el 6
      won("ana", "2026-11-06-bonus", "12:01:00"), // ya tiene título → no
      won("luis", "2026-11-06-bonus", "12:03:00"), // gana la bonus
      won("luis", "2026-11-07", "00:01:00"), // ya tiene la bonus → no
      won("eva", "2026-11-07", "00:02:00"),
    ]);
    expect(w.get("2026-11-06")?.participantId).toBe("ana");
    expect(w.get("2026-11-06-bonus")?.participantId).toBe("luis");
    expect(w.get("2026-11-07")?.participantId).toBe("eva");
  });

  it("explains which title blocks the player", () => {
    const winners = keyed(pickDayWinners([won("luis", "2026-11-06-bonus", "12:03:00")]));
    expect(titleStatus("luis", "2026-11-06-bonus", true, winners)).toEqual({ kind: "winner" });
    expect(titleStatus("luis", "2026-11-08", true, winners)).toEqual({
      kind: "already",
      titleDate: "2026-11-06-bonus",
    });
    expect(describeTitle("2026-11-06-bonus")).toBe("la ronda bonus del 6 de noviembre");
    expect(describeTitle("2026-11-05")).toBe("el Día 2");
  });
});
