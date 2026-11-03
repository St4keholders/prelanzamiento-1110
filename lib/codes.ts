/**
 * Winner codes: "11D-" + 6 chars from a 32-symbol alphabet (no 0/O/1/I).
 * Production codes are generated atomically in Postgres (`ahd_win_code`);
 * this module mirrors the format for validation, tests and admin search.
 */

export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_PREFIX = "11D-";
export const CODE_LENGTH = 6;
export const CODE_REGEX = /^11D-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export function generateWinCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so `% 32` is unbiased.
  return CODE_PREFIX + Array.from(bytes, (b) => CODE_ALPHABET[b % 32]).join("");
}

export function isValidWinCode(code: string): boolean {
  return CODE_REGEX.test(code);
}
