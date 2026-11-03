import { describe, expect, it } from "vitest";
import {
  END_EXCLUSIVE,
  START,
  allGameDates,
  formatEditDeadline,
  formatLongDate,
  getDayNumber,
  getGameDate,
  getPhase,
  isWordEditable,
  nextMidnightBogota,
} from "@/lib/time";

const bog = (local: string) => new Date(`${local}-05:00`);

describe("constants", () => {
  it("START and END match Bogotá midnight", () => {
    expect(START.toISOString()).toBe("2026-11-04T05:00:00.000Z");
    expect(END_EXCLUSIVE.toISOString()).toBe("2026-11-15T05:00:00.000Z");
  });
});

describe("getGameDate", () => {
  it("uses Bogotá date, not UTC", () => {
    // 2026-11-05 02:00 UTC is still Nov 4 in Bogotá.
    expect(getGameDate(new Date("2026-11-05T02:00:00Z"))).toBe("2026-11-04");
    expect(getGameDate(bog("2026-11-03T23:59:59"))).toBe("2026-11-03");
    expect(getGameDate(bog("2026-11-04T00:00:00"))).toBe("2026-11-04");
    expect(getGameDate(bog("2026-11-14T23:59:59"))).toBe("2026-11-14");
    expect(getGameDate(bog("2026-11-15T00:00:00"))).toBe("2026-11-15");
  });
});

describe("getPhase", () => {
  it("handles borders", () => {
    expect(getPhase(bog("2026-11-03T23:59:59"))).toBe("before");
    expect(getPhase(bog("2026-11-04T00:00:00"))).toBe("active");
    expect(getPhase(bog("2026-11-14T23:59:59"))).toBe("active");
    expect(getPhase(bog("2026-11-15T00:00:00"))).toBe("ended");
  });
  it("handles 1ms around borders", () => {
    expect(getPhase(new Date(START.getTime() - 1))).toBe("before");
    expect(getPhase(new Date(END_EXCLUSIVE.getTime() - 1))).toBe("active");
  });
});

describe("getDayNumber", () => {
  it("maps 4..14 Nov to 1..11", () => {
    expect(getDayNumber("2026-11-04")).toBe(1);
    expect(getDayNumber("2026-11-06")).toBe(3);
    expect(getDayNumber("2026-11-14")).toBe(11);
  });
  it("returns null outside the challenge", () => {
    expect(getDayNumber("2026-11-03")).toBeNull();
    expect(getDayNumber("2026-11-15")).toBeNull();
    expect(getDayNumber("nope")).toBeNull();
  });
  it("lists the 11 dates", () => {
    const dates = allGameDates();
    expect(dates).toHaveLength(11);
    expect(dates[0]).toBe("2026-11-04");
    expect(dates[10]).toBe("2026-11-14");
  });
});

describe("nextMidnightBogota", () => {
  it("returns next local midnight", () => {
    expect(nextMidnightBogota(bog("2026-11-03T23:59:59")).toISOString()).toBe(
      "2026-11-04T05:00:00.000Z",
    );
    expect(nextMidnightBogota(bog("2026-11-04T00:00:00")).toISOString()).toBe(
      "2026-11-05T05:00:00.000Z",
    );
    expect(nextMidnightBogota(bog("2026-11-14T23:59:59")).toISOString()).toBe(
      "2026-11-15T05:00:00.000Z",
    );
    expect(nextMidnightBogota(bog("2026-11-06T12:30:00")).toISOString()).toBe(
      "2026-11-07T05:00:00.000Z",
    );
  });
});

describe("formatLongDate", () => {
  it("formats in Spanish", () => {
    expect(formatLongDate("2026-11-06")).toBe("6 de noviembre de 2026");
  });
});

describe("isWordEditable", () => {
  it("allows editing only before the day starts (Bogotá)", () => {
    // 3 nov 17:30 → Día 1 (4 nov) y siguientes editables
    expect(isWordEditable("2026-11-04", bog("2026-11-03T17:30:00"))).toBe(true);
    expect(isWordEditable("2026-11-04", bog("2026-11-03T23:59:59"))).toBe(true);
    // 4 nov 00:00 → Día 1 bloqueado, Día 2 editable
    expect(isWordEditable("2026-11-04", bog("2026-11-04T00:00:00"))).toBe(false);
    expect(isWordEditable("2026-11-05", bog("2026-11-04T00:00:00"))).toBe(true);
    expect(isWordEditable("2026-11-05", bog("2026-11-04T23:59:59"))).toBe(true);
    expect(isWordEditable("2026-11-05", bog("2026-11-05T00:00:00"))).toBe(false);
    // días pasados y fechas fuera del reto
    expect(isWordEditable("2026-11-04", bog("2026-11-10T12:00:00"))).toBe(false);
    expect(isWordEditable("2026-11-15", bog("2026-11-03T12:00:00"))).toBe(false);
    expect(isWordEditable("2026-11-03", bog("2026-11-01T12:00:00"))).toBe(false);
  });

  it("formats the edit deadline as the previous day", () => {
    expect(formatEditDeadline("2026-11-05")).toMatch(/^hasta el 4 (de )?nov\.? a las 11:59 p\. m\.$/);
    expect(formatEditDeadline("2026-11-04")).toMatch(/^hasta el 3 (de )?nov/);
  });
});
