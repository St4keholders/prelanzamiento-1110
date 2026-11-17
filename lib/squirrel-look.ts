/**
 * Apariencia de cada ardilla (como los pollitos de Fried Chicken).
 * Se guarda como texto "estilo|ropa|cabeza|cara|barba|mano",
 * ej. "ardilla|vestido|flores|corazon|perlas|ramo".
 * Los valores viejos de 4 partes ("cabeza|cara|barba|mano") se leen como ardillo con chaleco.
 *
 * Cada opción lleva una etiqueta: "f" (pensada para ardillas), "m" (para ardillos) o
 * "u" (para todos). Todo se puede escoger con cualquier estilo; la etiqueta solo
 * ordena el catálogo y guía el "Al azar".
 */

export type Tag = "f" | "m" | "u";
export interface LookOption {
  id: string;
  name: string;
  tag: Tag;
}

export const STYLES = [
  { id: "ardillo", name: "Ardillo", tag: "m" },
  { id: "ardilla", name: "Ardilla", tag: "f" },
] as const satisfies readonly LookOption[];

export const OUTFITS = [
  { id: "chaleco", name: "Chaleco y corbata", tag: "m" },
  { id: "corbatin", name: "Chaleco y corbatín", tag: "u" },
  { id: "sueter", name: "Suéter", tag: "u" },
  { id: "blusa", name: "Blusa con lazo", tag: "f" },
  { id: "vestido", name: "Vestido de puntos", tag: "f" },
  { id: "blazer", name: "Blazer y perlas", tag: "f" },
  { id: "falda", name: "Chaleco y falda", tag: "f" },
] as const satisfies readonly LookOption[];

export const HEADS = [
  { id: "ninguno", name: "Sin nada", tag: "u" },
  { id: "visera", name: "Visera de contador", tag: "u" },
  { id: "birrete", name: "Birrete de grado", tag: "u" },
  { id: "lapiz", name: "Lápiz en la oreja", tag: "u" },
  { id: "casco", name: "Casco", tag: "u" },
  { id: "vueltiao", name: "Sombrero vueltiao", tag: "u" },
  { id: "gorra", name: "Gorra", tag: "u" },
  { id: "corona", name: "Corona", tag: "u" },
  { id: "bandana", name: "Bandana", tag: "u" },
  { id: "chef", name: "Gorro de chef", tag: "u" },
  { id: "vaquero", name: "Vaquero", tag: "u" },
  { id: "pirata", name: "Pirata", tag: "u" },
  { id: "mago", name: "Mago", tag: "u" },
  { id: "vikingo", name: "Vikingo", tag: "u" },
  { id: "fiesta", name: "Gorro de fiesta", tag: "u" },
  { id: "afro", name: "Afro", tag: "u" },
  { id: "mohicano", name: "Mohicano arcoíris", tag: "u" },
  { id: "copete", name: "Cresta punk", tag: "u" },
  { id: "tupe", name: "Tupé rockero", tag: "m" },
  { id: "colita", name: "Colita", tag: "u" },
  { id: "lazo", name: "Lazo grande", tag: "f" },
  { id: "flores", name: "Corona de flores", tag: "f" },
  { id: "pelolargo", name: "Pelo largo", tag: "f" },
  { id: "coleta", name: "Cola de caballo", tag: "f" },
  { id: "coletas", name: "Dos colitas", tag: "f" },
  { id: "trenzas", name: "Trenzas", tag: "f" },
  { id: "mono", name: "Moño alto", tag: "f" },
  { id: "rizos", name: "Rizos", tag: "f" },
  { id: "tiara", name: "Tiara", tag: "f" },
  { id: "pava", name: "Pava con flor", tag: "f" },
  { id: "cintillo", name: "Cintillo", tag: "f" },
  { id: "flor", name: "Flor en la oreja", tag: "f" },
] as const satisfies readonly LookOption[];

export const FACES = [
  { id: "ninguna", name: "Cara limpia", tag: "u" },
  { id: "lentes", name: "Lentes de nerd", tag: "u" },
  { id: "gafas", name: "Gafas de sol", tag: "u" },
  { id: "monoculo", name: "Monóculo", tag: "u" },
  { id: "luchador", name: "Máscara de luchador", tag: "u" },
  { id: "antifaz", name: "Antifaz de héroe", tag: "u" },
  { id: "parche", name: "Parche de pirata", tag: "u" },
  { id: "payaso", name: "Nariz de payaso", tag: "u" },
  { id: "ojogato", name: "Gafas ojo de gato", tag: "f" },
  { id: "corazon", name: "Gafas de corazón", tag: "f" },
  { id: "estrella", name: "Gafas de estrella", tag: "f" },
  { id: "pecas", name: "Pecas", tag: "u" },
] as const satisfies readonly LookOption[];

/** La tercera capa: barbas para ardillos, aretes y detalles para ardillas. */
export const BEARDS = [
  { id: "ninguna", name: "Sin barba ni aretes", tag: "u" },
  { id: "bigote", name: "Bigote", tag: "m" },
  { id: "frances", name: "Bigote francés", tag: "m" },
  { id: "barba", name: "Barba larga", tag: "m" },
  { id: "blanca", name: "Barba de abuelo", tag: "m" },
  { id: "candado", name: "Candado", tag: "m" },
  { id: "patillas", name: "Patillas", tag: "m" },
  { id: "perlas", name: "Aretes de perla", tag: "f" },
  { id: "argollas", name: "Argollas doradas", tag: "f" },
  { id: "aretesbellota", name: "Aretes de bellota", tag: "f" },
  { id: "aretescorazon", name: "Aretes de corazón", tag: "f" },
  { id: "lunar", name: "Lunar coqueto", tag: "f" },
] as const satisfies readonly LookOption[];

export const HANDS = [
  { id: "ninguno", name: "Manos libres", tag: "u" },
  { id: "calculadora", name: "Calculadora", tag: "u" },
  { id: "lupa", name: "Lupa de auditor", tag: "u" },
  { id: "lapizgigante", name: "Lápiz gigante", tag: "u" },
  { id: "cafe", name: "Café", tag: "u" },
  { id: "maletin", name: "Maletín", tag: "m" },
  { id: "sello", name: "Sello de aprobado", tag: "u" },
  { id: "monedas", name: "Bolsa de monedas", tag: "u" },
  { id: "laptop", name: "Laptop", tag: "u" },
  { id: "bellota", name: "Bellota", tag: "u" },
  { id: "bolso", name: "Bolso", tag: "f" },
  { id: "agenda", name: "Agenda", tag: "u" },
  { id: "ramo", name: "Ramo de flores", tag: "f" },
  { id: "abanico", name: "Abanico", tag: "f" },
  { id: "espejo", name: "Espejito", tag: "f" },
] as const satisfies readonly LookOption[];

export interface Look {
  style: string;
  outfit: string;
  head: string;
  face: string;
  beard: string;
  hand: string;
}

export type LookPart = keyof Look;
export type Style = (typeof STYLES)[number]["id"];

const ORDER: LookPart[] = ["style", "outfit", "head", "face", "beard", "hand"];

export const PARTS: Record<LookPart, readonly LookOption[]> = {
  style: STYLES,
  outfit: OUTFITS,
  head: HEADS,
  face: FACES,
  beard: BEARDS,
  hand: HANDS,
};

const FALLBACK: Look = {
  style: "ardillo",
  outfit: "chaleco",
  head: "ninguno",
  face: "ninguna",
  beard: "ninguna",
  hand: "ninguno",
};

export const DEFAULT_LOOK = "ardillo|chaleco|ninguno|lentes|ninguna|lapizgigante";
export const DEFAULT_LOOK_F = "ardilla|blusa|lazo|ojogato|perlas|agenda";

const NONE = new Set(["ninguno", "ninguna"]);

function has(part: LookPart, id: string | undefined): id is string {
  return PARTS[part].some((p) => p.id === id);
}

export function parseLook(value: string | null | undefined): Look {
  let parts = String(value || DEFAULT_LOOK).split("|");
  if (parts.length === 4) parts = ["ardillo", "chaleco", ...parts];
  const out = { ...FALLBACK };
  ORDER.forEach((k, i) => {
    if (has(k, parts[i])) out[k] = parts[i];
  });
  return out;
}

export function composeLook(l: Look): string {
  return ORDER.map((k) => l[k]).join("|");
}

/** Strict check used by the API (the stored text must be exactly a valid 6-part look). */
export function isValidLook(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split("|");
  return parts.length === ORDER.length && ORDER.every((k, i) => has(k, parts[i]));
}

export function isFem(look: Look): boolean {
  return look.style === "ardilla";
}

export function lookName(value: string): string {
  const l = parseLook(value);
  return ORDER.map((k) => PARTS[k].find((p) => p.id === l[k]))
    .filter((p) => p && !NONE.has(p.id))
    .map((p) => p!.name)
    .join(" · ");
}

/** Catálogo de una capa ordenado para el estilo: primero "nada", luego lo del estilo. */
export function optionsFor(part: LookPart, style: string): readonly LookOption[] {
  const list = PARTS[part];
  if (part === "style") return list;
  const own: Tag = style === "ardilla" ? "f" : "m";
  const other: Tag = own === "f" ? "m" : "f";
  const none = list.filter((p) => NONE.has(p.id));
  const rest = list.filter((p) => !NONE.has(p.id));
  return [
    ...none,
    ...rest.filter((p) => p.tag === own),
    ...rest.filter((p) => p.tag === "u"),
    ...rest.filter((p) => p.tag === other),
  ];
}

/**
 * Cambia el estilo. Si la ropa o la barba eran las típicas del otro estilo, las ajusta
 * (ardilla con chaleco y corbata → blusa; ardilla con barba → sin barba), pero respeta
 * lo que sea de todos.
 */
export function switchStyle(value: string, style: Style): string {
  const l = parseLook(value);
  if (l.style === style) return composeLook(l);
  const tagOf = (part: LookPart, id: string) => PARTS[part].find((p) => p.id === id)?.tag;
  const next: Look = { ...l, style };
  if (style === "ardilla") {
    if (tagOf("outfit", l.outfit) === "m") next.outfit = "blusa";
    if (tagOf("beard", l.beard) === "m") next.beard = "ninguna";
  } else {
    if (tagOf("outfit", l.outfit) === "f") next.outfit = "chaleco";
    if (tagOf("beard", l.beard) === "f") next.beard = "ninguna";
  }
  return composeLook(next);
}

/** Ardilla al azar del estilo dado (si no se da, se escoge al azar). */
export function randomLook(r: () => number = Math.random, style?: Style): string {
  const s: Style = style ?? (r() < 0.5 ? "ardillo" : "ardilla");
  const avoid: Tag = s === "ardilla" ? "m" : "f";
  const pick = (part: LookPart, none: number) => {
    const list = PARTS[part];
    if (r() < none && NONE.has(list[0].id)) return list[0].id;
    const pool = list.filter((p) => !NONE.has(p.id) && p.tag !== avoid);
    return pool[Math.floor(r() * pool.length)].id;
  };
  return composeLook({
    style: s,
    outfit: pick("outfit", 0),
    head: pick("head", 0.08),
    face: pick("face", 0.45),
    beard: pick("beard", s === "ardilla" ? 0.3 : 0.55),
    hand: pick("hand", 0.15),
  });
}
