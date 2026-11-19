import { describe, expect, it } from "vitest";
import { longestStreak, shortName } from "@/lib/ranking-utils";
import { teamErrorFrom } from "@/lib/team-error";
import {
  BEARDS, DEFAULT_LOOK, DEFAULT_LOOK_F, FACES, HANDS, HEADS, OUTFITS, STYLES,
  composeLook, isValidLook, lookName, optionsFor, parseLook, randomLook, switchStyle,
} from "@/lib/squirrel-look";
import { COLOR_KEYS, FLAG_KEYS, FLAGS, TABLES, TEAM_COLORS, colorHex, tableInfo } from "@/lib/teams-catalog";
import { contactSchema, teamAcceptSchema, teamCreateSchema, teamInviteSchema, teamJoinSchema, teamUpdateSchema } from "@/lib/validation";

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
  it("has 10 flags and colors with unique keys", () => {
    for (const list of [FLAGS, TEAM_COLORS]) {
      expect(list).toHaveLength(10);
      expect(new Set(list.map((x) => x.key)).size).toBe(10);
    }
    expect(colorHex("petroleo")).toBe("#1F6F78");
    expect(colorHex("nope")).toBe("#2B5932");
  });
});

const CONTACT = { fullName: "  Ana   Ríos ", phone: "300 123-4567", profession: "  Contadora   pública " };

describe("contact data", () => {
  it("is required to reserve, join or accept", () => {
    const sq = "ardilla|blusa|lazo|lentes|perlas|cafe";
    const team = { tableNumber: 3, squirrel: sq };
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
  it("creates a team on a fixed table", () => {
    const r = teamCreateSchema.parse({
      ...CONTACT,
      tableNumber: "4",
      motto: "  Ni un peso sin conciliar ",
      squirrel: "ardillo|chaleco|vaquero|lentes|bigote|calculadora",
    });
    expect(r).toEqual({
      fullName: "Ana Ríos",
      phone: "3001234567",
      profession: "Contadora pública",
      tableNumber: 4,
      motto: "Ni un peso sin conciliar",
      squirrel: "ardillo|chaleco|vaquero|lentes|bigote|calculadora",
    });
  });
  it("rejects unknown tables and bad looks", () => {
    const base = { ...CONTACT, tableNumber: 1, squirrel: "ardilla|vestido|ninguno|ninguna|ninguna|ninguno" };
    expect(teamCreateSchema.safeParse({ ...base, tableNumber: 0 }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, tableNumber: 11 }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, tableNumber: 2.5 }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, squirrel: "zorro" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, motto: "x".repeat(61) }).success).toBe(false);
    expect(teamUpdateSchema.parse({ motto: " Hola " })).toEqual({ motto: "Hola" });
  });
  it("has 10 tables with unique names and valid flags and colors", () => {
    expect(TABLES).toHaveLength(10);
    expect(new Set(TABLES.map((t) => t.name)).size).toBe(10);
    expect(new Set(TABLES.map((t) => t.flag)).size).toBe(10);
    expect(new Set(TABLES.map((t) => t.color)).size).toBe(10);
    for (const t of TABLES) {
      expect(FLAG_KEYS).toContain(t.flag);
      expect(COLOR_KEYS).toContain(t.color);
    }
    expect(tableInfo(1)?.name).toBe("Las Sindiardillas");
    expect(tableInfo(11)).toBeUndefined();
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
