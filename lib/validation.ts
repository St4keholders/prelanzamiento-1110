import { z } from "zod";
import { MAX_TIME_LIMIT, MIN_TIME_LIMIT, TIME_LIMIT_SECONDS } from "@/lib/time";
import { isValidLook } from "@/lib/squirrel-look";
import { COLOR_KEYS, FLAG_KEYS, TABLES } from "@/lib/teams-catalog";
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

export const fullNameSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(3, { message: "Escribe el nombre completo (mínimo 3 caracteres)." })
      .max(120, { message: "El nombre es demasiado largo." }),
  );

export const professionSchema = z
  .string({ message: "Escribe tu profesión." })
  .trim()
  .transform((v) => v.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, { message: "Escribe tu profesión." })
      .max(80, { message: "La profesión es muy larga (máximo 80 caracteres)." }),
  );

export const registerSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  /** Solo la pide el registro del evento de lanzamiento. */
  profession: professionSchema.optional(),
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
  timeLimitSeconds: z.coerce
    .number()
    .int({ message: "El tiempo debe ser un número entero de segundos." })
    .min(MIN_TIME_LIMIT, { message: `El tiempo mínimo es ${MIN_TIME_LIMIT} segundos.` })
    .max(MAX_TIME_LIMIT, { message: `El tiempo máximo es ${MAX_TIME_LIMIT / 60} minutos.` })
    .default(TIME_LIMIT_SECONDS),
  /** Start time "HH:MM" (24 h, hora Colombia) on the word's own date. */
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Hora de inicio no válida (usa HH:MM)." })
    .default("00:00"),
});

/** First validation message, for friendly API errors. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos.";
}

// ---------------------------------------------------------------------------
// Teams de Ardillas
// ---------------------------------------------------------------------------

const squirrelSchema = z.string().refine(isValidLook, { message: "Arma tu ardilla." });

const teamFields = {
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, { message: "Ponle un nombre a tu team (mínimo 2 letras)." })
        .max(30, { message: "El nombre del team es muy largo (máximo 30 caracteres)." }),
    ),
  flag: z.enum(FLAG_KEYS, { message: "Escoge la bandera del team." }),
  color: z.enum(COLOR_KEYS, { message: "Escoge el color del team." }),
  motto: z
    .string()
    .trim()
    .max(60, { message: "El lema es muy largo (máximo 60 caracteres)." })
    .default(""),
};

/** Datos que deja todo el que reserva o se une a una mesa (el correo es el de su sesión). */
const contactFields = {
  fullName: fullNameSchema,
  phone: phoneSchema,
  profession: professionSchema,
};
export const contactSchema = z.object(contactFields);

export const teamCreateSchema = z.object({
  tableNumber: z.coerce
    .number({ message: "Escoge una mesa." })
    .int({ message: "Escoge una mesa." })
    .min(1, { message: "Escoge una mesa." })
    .max(TABLES.length, { message: "Escoge una mesa." }),
  motto: teamFields.motto,
  ...contactFields,
  squirrel: squirrelSchema,
});
export const teamUpdateSchema = z.object({ motto: teamFields.motto });
export const teamJoinSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,10}$/, { message: "Escribe el código que te pasó el capitán." }),
  ...contactFields,
  squirrel: squirrelSchema,
});
export const teamSquirrelSchema = z.object({ squirrel: squirrelSchema });
export const teamAcceptSchema = z.object({ ...contactFields, squirrel: squirrelSchema });
export const teamInviteSchema = z.object({ email: emailSchema, fullName: fullNameSchema });
export const teamIdSchema = z.object({ id: z.uuid({ message: "Dato no válido." }) });
