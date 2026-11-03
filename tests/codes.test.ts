import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, generateWinCode, isValidWinCode } from "@/lib/codes";

describe("win codes", () => {
  it("alphabet has 32 unambiguous symbols", () => {
    expect(CODE_ALPHABET).toHaveLength(32);
    expect(new Set(CODE_ALPHABET).size).toBe(32);
    for (const ch of "0O1I") expect(CODE_ALPHABET).not.toContain(ch);
  });

  it("generates valid, random codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const code = generateWinCode();
      expect(code).toMatch(/^11D-[A-Z2-9]{6}$/);
      expect(isValidWinCode(code)).toBe(true);
      codes.add(code);
    }
    expect(codes.size).toBeGreaterThan(1990);
  });

  it("rejects invalid codes", () => {
    expect(isValidWinCode("11D-7KQ2XM")).toBe(true);
    expect(isValidWinCode("11D-7KQ2X0")).toBe(false);
    expect(isValidWinCode("11D-7KQ2X")).toBe(false);
    expect(isValidWinCode("12D-7KQ2XM")).toBe(false);
  });
});
