import { describe, expect, it } from "vitest";
import { longestStreak, shortName } from "@/lib/ranking-utils";
import { teamErrorFrom } from "@/lib/team-error";
import { FLAGS, SQUIRRELS, TEAM_COLORS, colorHex } from "@/lib/teams-catalog";
import { teamCreateSchema, teamInviteSchema, teamJoinSchema } from "@/lib/validation";

describe("ranking utils", () => {
  it("longest streak of won days", () => {
    expect(longestStreak(["won", "won", "lost", "won", "won", "won", "missed"])).toBe(3);
    expect(longestStreak(["lost", "missed"])).toBe(0);
    expect(longestStreak([])).toBe(0);
  });
  it("short names", () => {
    expect(shortName("Sebastián Avila Gómez")).toBe("Sebastián A.");
    expect(shortName("Ana")).toBe("Ana");
  });
});

describe("teams catalog", () => {
  it("has 8 squirrels, flags and colors with unique keys", () => {
    for (const list of [SQUIRRELS, FLAGS, TEAM_COLORS]) {
      expect(list).toHaveLength(8);
      expect(new Set(list.map((x) => x.key)).size).toBe(8);
    }
    expect(colorHex("petroleo")).toBe("#1F6F78");
    expect(colorHex("nope")).toBe("#2B5932");
  });
});

describe("team validation", () => {
  it("creates a team with normalized fields", () => {
    const r = teamCreateSchema.parse({
      name: "  Los   Debe ",
      flag: "niif",
      color: "verde",
      squirrel: "auditora",
    });
    expect(r).toEqual({ name: "Los Debe", flag: "niif", color: "verde", motto: "", squirrel: "auditora" });
  });
  it("rejects unknown options and long names", () => {
    const base = { name: "Team", flag: "niif", color: "verde", squirrel: "clasica" };
    expect(teamCreateSchema.safeParse({ ...base, flag: "pirata" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "zorro" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, name: "x".repeat(31) }).success).toBe(false);
  });
  it("normalizes join codes and invite emails", () => {
    expect(teamJoinSchema.parse({ code: " k7q2xm ", squirrel: "clasica" }).code).toBe("K7Q2XM");
    expect(teamJoinSchema.safeParse({ code: "K7-Q2", squirrel: "clasica" }).success).toBe(false);
    expect(teamInviteSchema.parse({ email: " Ana@Correo.COM ", fullName: "Ana Ríos" }).email).toBe(
      "ana@correo.com",
    );
  });
});

describe("team errors", () => {
  it("maps database exceptions to friendly messages", () => {
    expect(teamErrorFrom("ERROR: no_tables").status).toBe(409);
    expect(teamErrorFrom("P0001: team_full").message).toMatch(/puestos libres/);
    expect(teamErrorFrom("algo raro").code).toBe("internal");
  });
});
