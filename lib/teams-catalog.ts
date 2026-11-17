/** Choices for the "Teams de Ardillas" (keys are stored in the database). */

export const SQUIRRELS = [
  { key: "clasica", name: "La Clásica", hint: "Gafas y lápiz, como la mascota" },
  { key: "auditora", name: "La Auditora", hint: "Lupa para revisarlo todo" },
  { key: "tributaria", name: "La Tributaria", hint: "Calculadora en mano" },
  { key: "senior", name: "La Contadora Senior", hint: "Corbata y experiencia" },
  { key: "analista", name: "La Analista", hint: "Gráficas para todo" },
  { key: "tesorera", name: "La Tesorera", hint: "Cuida cada moneda" },
  { key: "revisora", name: "La Revisora Fiscal", hint: "Sello de aprobado" },
  { key: "practicante", name: "La Practicante", hint: "Café y post-its" },
] as const;

export const FLAGS = [
  { key: "partida-doble", name: "Partida Doble" },
  { key: "balance-general", name: "Balance General" },
  { key: "niif", name: "NIIF" },
  { key: "conciliacion", name: "Conciliación" },
  { key: "cierre-fiscal", name: "Cierre Fiscal" },
  { key: "libro-mayor", name: "Libro Mayor" },
  { key: "calculadora", name: "Calculadora Dorada" },
  { key: "sello", name: "Sello de Auditoría" },
] as const;

export const TEAM_COLORS = [
  { key: "verde", name: "Verde 11Diez", hex: "#2B5932" },
  { key: "lima", name: "Lima", hex: "#8FA83A" },
  { key: "amarillo", name: "Amarillo", hex: "#E2B12F" },
  { key: "naranja", name: "Naranja", hex: "#E8692B" },
  { key: "rojo", name: "Rojo", hex: "#C0392B" },
  { key: "petroleo", name: "Azul petróleo", hex: "#1F6F78" },
  { key: "morado", name: "Morado", hex: "#6B3FA0" },
  { key: "cafe", name: "Café ardilla", hex: "#8A4B22" },
] as const;

export type SquirrelKey = (typeof SQUIRRELS)[number]["key"];
export type FlagKey = (typeof FLAGS)[number]["key"];
export type TeamColorKey = (typeof TEAM_COLORS)[number]["key"];

export const SQUIRREL_KEYS = SQUIRRELS.map((s) => s.key) as [SquirrelKey, ...SquirrelKey[]];
export const FLAG_KEYS = FLAGS.map((f) => f.key) as [FlagKey, ...FlagKey[]];
export const COLOR_KEYS = TEAM_COLORS.map((c) => c.key) as [TeamColorKey, ...TeamColorKey[]];

export function colorHex(key: string): string {
  return TEAM_COLORS.find((c) => c.key === key)?.hex ?? TEAM_COLORS[0].hex;
}
export function squirrelName(key: string): string {
  return SQUIRRELS.find((s) => s.key === key)?.name ?? "Ardilla";
}
export function flagName(key: string): string {
  return FLAGS.find((f) => f.key === key)?.name ?? "Bandera";
}
