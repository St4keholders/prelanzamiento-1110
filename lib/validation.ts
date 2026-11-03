import { z } from "zod";
import { ALPHABET } from "@/lib/word";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Escribe un correo válido." }).max(254));

export const identifySchema = z.object({ email: emailSchema });

/** Keeps digits and a leading "+", strips spaces/dashes/parentheses. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[\s\-().]/g, "").replace(/^\+/, "");
}

export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .regex(/^\+?\d{7,15}$/, { message: "Escribe un celular válido (7 a 15 dígitos)." }),
  );

export const registerSchema = z.object({
  email: emailSchema,
  fullName: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(3, { message: "Escribe tu nombre completo (mínimo 3 caracteres)." })
        .max(120, { message: "El nombre es demasiado largo." }),
    ),
  phone: phoneSchema,
});

export const guessSchema = z.object({
  letter: z.enum(ALPHABET, { message: "Letra no válida." }),
});

export const adminLoginSchema = z.object({
  user: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

/** Uppercases (keeping tildes and Ñ), trims and collapses spaces. */
export function normalizeWordInput(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLocaleUpperCase("es-CO");
}

export const dailyWordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha no válida." }),
  word: z
    .string()
    .transform(normalizeWordInput)
    .pipe(
      z
        .string()
        .min(2, { message: "Escribe la palabra (mínimo 2 letras)." })
        .max(60, { message: "La palabra es demasiado larga (máximo 60 caracteres)." })
        .regex(/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ .\-]*$/, {
          message: "Usa solo letras (con o sin tilde, Ñ), espacios, guiones o puntos.",
        }),
    ),
  category: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, { message: "Escribe la categoría." })
        .max(40, { message: "La categoría es demasiado larga (máximo 40 caracteres)." }),
    ),
});

/** First validation message, for friendly API errors. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos.";
}
