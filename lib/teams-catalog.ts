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
  { key: "sindicato", name: "Sindicato" },
  { key: "exogena", name: "Exógena" },
  { key: "debi", name: "Debi" },
  { key: "credi", name: "Credi" },
  { key: "nuez", name: "Nuez" },
  { key: "balance-rojo", name: "Balance Rojo" },
  { key: "ringo", name: "Ringo" },
  { key: "avellana", name: "Avellana" },
  { key: "rompenueces", name: "Rompenueces" },
  { key: "clan-bellota", name: "Clan de la Bellota" },
  { key: "escuadron-bellota", name: "Escuadrón Bellota" },
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
  { key: "cielo", name: "Azul cielo", hex: "#2F86C8" },
  { key: "rosado", name: "Rosado", hex: "#D6458A" },
  { key: "vino", name: "Vino", hex: "#7A1E3A" },
  { key: "negro", name: "Negro", hex: "#1F1F1F" },
  { key: "lila", name: "Lila", hex: "#9474C4" },
  { key: "mostaza", name: "Mostaza", hex: "#C08A12" },
  { key: "marino", name: "Azul marino", hex: "#1E3A5F" },
] as const;

export type FlagKey = (typeof FLAGS)[number]["key"];
export type TeamColorKey = (typeof TEAM_COLORS)[number]["key"];

export const FLAG_KEYS = FLAGS.map((f) => f.key) as [FlagKey, ...FlagKey[]];
export const COLOR_KEYS = TEAM_COLORS.map((c) => c.key) as [TeamColorKey, ...TeamColorKey[]];

/**
 * Las 10 mesas del evento, con nombre, bandera y color fijos (definidos por el equipo 1110).
 * El capitán escoge una mesa libre; el team toma su nombre, bandera y color.
 */
export const TABLES = [
  { number: 1, name: "Sindiardillas", flag: "sindicato", color: "cafe" },
  { number: 2, name: "Team Debi", flag: "debi", color: "verde" },
  { number: 3, name: "Team Credi", flag: "credi", color: "vino" },
  { number: 4, name: "Team Nuez", flag: "nuez", color: "naranja" },
  { number: 5, name: "Team Balance Rojo", flag: "balance-rojo", color: "negro" },
  { number: 6, name: "Team Ringo", flag: "ringo", color: "lila" },
  { number: 7, name: "Team Avellana", flag: "avellana", color: "mostaza" },
  { number: 8, name: "Rompenueces", flag: "rompenueces", color: "marino" },
  { number: 9, name: "El Clan de la Bellota", flag: "clan-bellota", color: "lima" },
  { number: 10, name: "Escuadrón Bellota", flag: "escuadron-bellota", color: "rosado" },
] as const satisfies readonly { number: number; name: string; flag: FlagKey; color: TeamColorKey }[];

export type TableInfo = (typeof TABLES)[number];

export function tableInfo(n: number): TableInfo | undefined {
  return TABLES.find((t) => t.number === n);
}

export function colorHex(key: string): string {
  return TEAM_COLORS.find((c) => c.key === key)?.hex ?? TEAM_COLORS[0].hex;
}
export function flagName(key: string): string {
  return FLAGS.find((f) => f.key === key)?.name ?? "Bandera";
}
