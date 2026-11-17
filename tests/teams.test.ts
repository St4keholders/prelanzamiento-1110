import { describe, expect, it } from "vitest";
import { longestStreak, shortName } from "@/lib/ranking-utils";
import { teamErrorFrom } from "@/lib/team-error";
import { BEARDS, FACES, HANDS, HEADS, composeLook, isValidLook, lookName, parseLook, randomLook } from "@/lib/squirrel-look";
import { FLAGS, TEAM_COLORS, colorHex } from "@/lib/teams-catalog";
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
  it("has 8 flags and colors with unique keys", () => {
    for (const list of [FLAGS, TEAM_COLORS]) {
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
      squirrel: "vaquero|lentes|bigote|calculadora",
    });
    expect(r).toEqual({
      name: "Los Debe",
      flag: "niif",
      color: "verde",
      motto: "",
      squirrel: "vaquero|lentes|bigote|calculadora",
    });
  });
  it("rejects unknown options and long names", () => {
    const base = { name: "Team", flag: "niif", color: "verde", squirrel: "ninguno|ninguna|ninguna|ninguno" };
    expect(teamCreateSchema.safeParse({ ...base, flag: "pirata" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "zorro" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "vaquero|lentes|bigote" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, name: "x".repeat(31) }).success).toBe(false);
  });
  it("normalizes join codes and invite emails", () => {
    expect(teamJoinSchema.parse({ code: " k7q2xm ", squirrel: "ninguno|lentes|ninguna|cafe" }).code).toBe("K7Q2XM");
    expect(teamJoinSchema.safeParse({ code: "K7-Q2", squirrel: "ninguno|lentes|ninguna|cafe" }).success).toBe(false);
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

describe("squirrel look", () => {
  it("parses, composes and validates looks", () => {
    const l = parseLook("vaquero|lentes|bigote|calculadora");
    expect(l).toEqual({ head: "vaquero", face: "lentes", beard: "bigote", hand: "calculadora" });
    expect(composeLook(l)).toBe("vaquero|lentes|bigote|calculadora");
    expect(parseLook("nope|x|y|z")).toEqual({ head: "ninguno", face: "ninguna", beard: "ninguna", hand: "ninguno" });
    expect(isValidLook("vaquero|lentes|bigote|calculadora")).toBe(true);
    expect(isValidLook("vaquero|lentes|bigote")).toBe(false);
    expect(lookName("ninguno|ninguna|ninguna|ninguno")).toBe("Sin accesorios");
    expect(lookName("vueltiao|ninguna|bigote|ninguno")).toBe("Sombrero vueltiao · Bigote");
  });
  it("random looks are always valid and option ids are unique", () => {
    for (let i = 0; i < 200; i++) expect(isValidLook(randomLook())).toBe(true);
    for (const list of [HEADS, FACES, BEARDS, HANDS]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
  });
});
