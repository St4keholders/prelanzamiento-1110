import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY");
  },
  get sessionSecret() {
    const value = required("SESSION_SECRET");
    if (value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
    return value;
  },
  get adminUser() {
    return required("ADMIN_USER");
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD");
  },
  isProduction: process.env.NODE_ENV === "production",
};

const processStartedAt = Date.now();

/**
 * Fake server time for local testing. Completely ignored in production.
 * Returns null when there is no override, so SQL functions use the real now().
 */
export function getFakeNow(): Date | null {
  if (process.env.NODE_ENV === "production") return null;
  const raw = process.env.DEV_FAKE_NOW;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  // Keep the clock ticking from the fake start so timers behave realistically.
  return new Date(parsed.getTime() + (Date.now() - processStartedAt));
}

/** Server "now" (fake in dev when DEV_FAKE_NOW is set). */
export function serverNow(): Date {
  return getFakeNow() ?? new Date();
}
