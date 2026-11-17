/** Choices for the "Teams de Ardillas" (keys are stored in the database). */

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

export type FlagKey = (typeof FLAGS)[number]["key"];
export type TeamColorKey = (typeof TEAM_COLORS)[number]["key"];

export const FLAG_KEYS = FLAGS.map((f) => f.key) as [FlagKey, ...FlagKey[]];
export const COLOR_KEYS = TEAM_COLORS.map((c) => c.key) as [TeamColorKey, ...TeamColorKey[]];

export function colorHex(key: string): string {
  return TEAM_COLORS.find((c) => c.key === key)?.hex ?? TEAM_COLORS[0].hex;
}
export function flagName(key: string): string {
  return FLAGS.find((f) => f.key === key)?.name ?? "Bandera";
}
