import { describe, expect, it } from "vitest";
import { QWERTY_ROWS } from "@/components/Keyboard";
import { ALPHABET } from "@/lib/word";

describe("QWERTY keyboard", () => {
  it("has the 27 letters exactly once, Ñ after L", () => {
    const flat = QWERTY_ROWS.flat();
    expect(flat).toHaveLength(27);
    expect(new Set(flat)).toEqual(new Set(ALPHABET));
    expect(QWERTY_ROWS[1].join("")).toBe("ASDFGHJKLÑ");
    expect(QWERTY_ROWS[0].join("")).toBe("QWERTYUIOP");
    expect(QWERTY_ROWS[2].join("")).toBe("ZXCVBNM");
  });
});
