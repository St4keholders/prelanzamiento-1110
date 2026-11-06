import { describe, expect, it } from "vitest";
import { participantsSheet, toCsv } from "@/lib/export";
import { dailyWordSchema, normalizePhone, registerSchema } from "@/lib/validation";

describe("validation", () => {
  it("normalizes phone numbers", () => {
    expect(normalizePhone(" +57 300 123 4567 ")).toBe("+573001234567");
    expect(normalizePhone("(300) 123-4567")).toBe("3001234567");
  });

  it("validates registration", () => {
    const ok = registerSchema.safeParse({
      email: "  Juan@Gmail.COM ",
      fullName: "  Juan   Pérez ",
      phone: "300 123 4567",
    });
    expect(ok.success && ok.data).toEqual({
      email: "juan@gmail.com",
      fullName: "Juan Pérez",
      phone: "3001234567",
    });
    expect(registerSchema.safeParse({ email: "x", fullName: "Ab", phone: "12" }).success).toBe(
      false,
    );
    expect(
      registerSchema.safeParse({ email: "a@b.co", fullName: "Ana", phone: "12345a7" }).success,
    ).toBe(false);
  });
});

describe("csv", () => {
  it("adds BOM, uses ; and escapes formulas", () => {
    const csv = toCsv(
      participantsSheet([
        {
          full_name: "=HYPERLINK(1)",
          email: "a;b@x.co",
          phone: "+573001234567",
          created_at: "2026-11-04T05:00:00Z",
          last_seen_at: "2026-11-04T05:00:00Z",
          days_played: 1,
          days_won: 0,
          phone_dup_count: 1,
        },
      ]),
    );
    expect(csv.startsWith("\uFEFFNombre;Correo")).toBe(true);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"a;b@x.co"');
    expect(csv).toContain(";+573001234567;");
  });
});

describe("dailyWordSchema", () => {
  it("normalizes word and category", () => {
    const ok = dailyWordSchema.safeParse({
      date: "2026-11-05",
      word: "  retención   en la fuente ",
      category: "  Impuestos  nacionales ",
    });
    expect(ok.success && ok.data).toEqual({
      date: "2026-11-05",
      word: "RETENCIÓN EN LA FUENTE",
      category: "Impuestos nacionales",
      timeLimitSeconds: 90,
    });
    expect(dailyWordSchema.safeParse({ date: "2026-11-05", word: "año-base", category: "Renta" })
      .success).toBe(true);
  });

  it("rejects invalid words", () => {
    const base = { date: "2026-11-05", category: "Renta" };
    expect(dailyWordSchema.safeParse({ ...base, word: "" }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, word: "IVA 19%" }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, word: "-IVA" }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, word: "IVA", category: "" }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, date: "5/11/2026", word: "IVA" }).success).toBe(
      false,
    );
  });
});

describe("dailyWordSchema timeLimitSeconds", () => {
  const base = { date: "2026-11-07", word: "IVA", category: "Renta" };
  it("defaults to 1:30 and accepts 30 s – 3 min", () => {
    expect(dailyWordSchema.parse(base).timeLimitSeconds).toBe(90);
    expect(dailyWordSchema.parse({ ...base, timeLimitSeconds: 60 }).timeLimitSeconds).toBe(60);
    expect(dailyWordSchema.parse({ ...base, timeLimitSeconds: "120" }).timeLimitSeconds).toBe(120);
  });
  it("rejects out-of-range or fractional times", () => {
    expect(dailyWordSchema.safeParse({ ...base, timeLimitSeconds: 10 }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, timeLimitSeconds: 600 }).success).toBe(false);
    expect(dailyWordSchema.safeParse({ ...base, timeLimitSeconds: 90.5 }).success).toBe(false);
  });
});
