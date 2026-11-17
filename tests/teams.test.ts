import { describe, expect, it } from "vitest";
import { longestStreak, shortName } from "@/lib/ranking-utils";
import { teamErrorFrom } from "@/lib/team-error";
import {
  BEARDS, DEFAULT_LOOK, DEFAULT_LOOK_F, FACES, HANDS, HEADS, OUTFITS, STYLES,
  composeLook, isValidLook, lookName, optionsFor, parseLook, randomLook, switchStyle,
} from "@/lib/squirrel-look";
import { FLAGS, TEAM_COLORS, colorHex } from "@/lib/teams-catalog";
import { contactSchema, teamAcceptSchema, teamCreateSchema, teamInviteSchema, teamJoinSchema } from "@/lib/validation";

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

const CONTACT = { fullName: "  Ana   Ríos ", phone: "300 123-4567", profession: "  Contadora   pública " };

describe("contact data", () => {
  it("is required to reserve, join or accept", () => {
    const sq = "ardilla|blusa|lazo|lentes|perlas|cafe";
    const team = { name: "Team", flag: "niif", color: "verde", squirrel: sq };
    expect(teamCreateSchema.safeParse(team).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...team, ...CONTACT, profession: " " }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...team, ...CONTACT, phone: "12" }).success).toBe(false);
    expect(teamJoinSchema.safeParse({ code: "K7Q2XM", squirrel: sq }).success).toBe(false);
    expect(teamAcceptSchema.safeParse({ squirrel: sq }).success).toBe(false);
    expect(teamAcceptSchema.parse({ ...CONTACT, squirrel: sq }).profession).toBe("Contadora pública");
    expect(contactSchema.safeParse({ ...CONTACT, profession: "x".repeat(81) }).success).toBe(false);
  });
});

describe("team validation", () => {
  it("creates a team with normalized fields", () => {
    const r = teamCreateSchema.parse({
      ...CONTACT,
      name: "  Los   Debe ",
      flag: "niif",
      color: "verde",
      squirrel: "ardillo|chaleco|vaquero|lentes|bigote|calculadora",
    });
    expect(r).toEqual({
      fullName: "Ana Ríos",
      phone: "3001234567",
      profession: "Contadora pública",
      name: "Los Debe",
      flag: "niif",
      color: "verde",
      motto: "",
      squirrel: "ardillo|chaleco|vaquero|lentes|bigote|calculadora",
    });
  });
  it("rejects unknown options and long names", () => {
    const base = { ...CONTACT, name: "Team", flag: "niif", color: "verde", squirrel: "ardilla|vestido|ninguno|ninguna|ninguna|ninguno" };
    expect(teamCreateSchema.safeParse({ ...base, flag: "pirata" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "zorro" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "vaquero|lentes|bigote" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, name: "x".repeat(31) }).success).toBe(false);
  });
  it("normalizes join codes and invite emails", () => {
    expect(teamJoinSchema.parse({ ...CONTACT, code: " k7q2xm ", squirrel: "ardilla|blusa|lazo|lentes|perlas|cafe" }).code).toBe("K7Q2XM");
    expect(teamJoinSchema.safeParse({ ...CONTACT, code: "K7-Q2", squirrel: "ardilla|blusa|lazo|lentes|perlas|cafe" }).success).toBe(false);
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
  it("parses, composes and validates 6-part looks", () => {
    const l = parseLook("ardilla|vestido|flores|corazon|perlas|ramo");
    expect(l).toEqual({ style: "ardilla", outfit: "vestido", head: "flores", face: "corazon", beard: "perlas", hand: "ramo" });
    expect(composeLook(l)).toBe("ardilla|vestido|flores|corazon|perlas|ramo");
    expect(isValidLook("ardilla|vestido|flores|corazon|perlas|ramo")).toBe(true);
    expect(isValidLook("ardillo|chaleco|vaquero|lentes|bigote|calculadora")).toBe(true);
    expect(isValidLook("vaquero|lentes|bigote|calculadora")).toBe(false);
    expect(isValidLook("ardilla|vestido|flores|corazon|perlas")).toBe(false);
    expect(isValidLook(DEFAULT_LOOK)).toBe(true);
    expect(isValidLook(DEFAULT_LOOK_F)).toBe(true);
    expect(lookName("ardilla|blusa|ninguno|ninguna|ninguna|ninguno")).toBe("Ardilla · Blusa con lazo");
  });
  it("reads old 4-part looks as ardillo con chaleco", () => {
    expect(parseLook("vaquero|lentes|bigote|calculadora")).toEqual({
      style: "ardillo", outfit: "chaleco", head: "vaquero", face: "lentes", beard: "bigote", hand: "calculadora",
    });
    expect(parseLook("nope|x|y|z|w|v").style).toBe("ardillo");
  });
  it("switching style swaps only the style-specific clothes and beard", () => {
    expect(switchStyle("ardillo|chaleco|vaquero|lentes|bigote|calculadora", "ardilla")).toBe(
      "ardilla|blusa|vaquero|lentes|ninguna|calculadora",
    );
    expect(switchStyle("ardilla|vestido|lazo|ojogato|perlas|bolso", "ardillo")).toBe(
      "ardillo|chaleco|lazo|ojogato|ninguna|bolso",
    );
    expect(switchStyle("ardillo|sueter|gorra|gafas|ninguna|cafe", "ardilla")).toBe(
      "ardilla|sueter|gorra|gafas|ninguna|cafe",
    );
  });
  it("orders the catalog by style, with 'none' first", () => {
    const f = optionsFor("head", "ardilla").map((p) => p.id);
    expect(f[0]).toBe("ninguno");
    expect(f[1]).toBe("lazo");
    expect(optionsFor("beard", "ardilla")[1].id).toBe("perlas");
    expect(optionsFor("beard", "ardillo")[1].id).toBe("bigote");
    expect(optionsFor("head", "ardillo")).toHaveLength(HEADS.length);
  });
  it("random looks are valid, keep the style, and option ids are unique", () => {
    for (let i = 0; i < 300; i++) {
      expect(isValidLook(randomLook())).toBe(true);
      const f = parseLook(randomLook(Math.random, "ardilla"));
      expect(f.style).toBe("ardilla");
      expect(BEARDS.find((b) => b.id === f.beard)?.tag).not.toBe("m");
      const m = parseLook(randomLook(Math.random, "ardillo"));
      expect(OUTFITS.find((o) => o.id === m.outfit)?.tag).not.toBe("f");
    }
    for (const list of [STYLES, OUTFITS, HEADS, FACES, BEARDS, HANDS]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
    expect(HEADS.filter((h) => h.tag === "f").length).toBeGreaterThanOrEqual(10);
  });
});
