/**
 * Apariencia de cada ardilla (como los pollitos de Fried Chicken):
 * combina una pieza de CABEZA, una de CARA, una BARBA y un ACCESORIO en la mano.
 * Se guarda como texto "cabeza|cara|barba|mano", ej. "vaquero|lentes|bigote|calculadora".
 */

export const HEADS = [
  { id: "ninguno", name: "Sin nada" },
  { id: "visera", name: "Visera de contador" },
  { id: "birrete", name: "Birrete de grado" },
  { id: "lapiz", name: "Lápiz en la oreja" },
  { id: "casco", name: "Casco" },
  { id: "vueltiao", name: "Sombrero vueltiao" },
  { id: "gorra", name: "Gorra" },
  { id: "corona", name: "Corona" },
  { id: "bandana", name: "Bandana" },
  { id: "chef", name: "Gorro de chef" },
  { id: "vaquero", name: "Vaquero" },
  { id: "pirata", name: "Pirata" },
  { id: "mago", name: "Mago" },
  { id: "vikingo", name: "Vikingo" },
  { id: "fiesta", name: "Gorro de fiesta" },
  { id: "afro", name: "Afro" },
  { id: "mohicano", name: "Mohicano arcoíris" },
  { id: "copete", name: "Cresta punk" },
  { id: "tupe", name: "Tupé rockero" },
  { id: "colita", name: "Colita" },
] as const;

export const FACES = [
  { id: "ninguna", name: "Cara limpia" },
  { id: "lentes", name: "Lentes de nerd" },
  { id: "gafas", name: "Gafas de sol" },
  { id: "monoculo", name: "Monóculo" },
  { id: "luchador", name: "Máscara de luchador" },
  { id: "antifaz", name: "Antifaz de héroe" },
  { id: "parche", name: "Parche de pirata" },
  { id: "payaso", name: "Nariz de payaso" },
] as const;

export const BEARDS = [
  { id: "ninguna", name: "Sin barba" },
  { id: "bigote", name: "Bigote" },
  { id: "frances", name: "Bigote francés" },
  { id: "barba", name: "Barba larga" },
  { id: "blanca", name: "Barba de abuelo" },
  { id: "candado", name: "Candado" },
  { id: "patillas", name: "Patillas" },
] as const;

export const HANDS = [
  { id: "ninguno", name: "Manos libres" },
  { id: "calculadora", name: "Calculadora" },
  { id: "lupa", name: "Lupa de auditor" },
  { id: "lapizgigante", name: "Lápiz gigante" },
  { id: "cafe", name: "Café" },
  { id: "maletin", name: "Maletín" },
  { id: "sello", name: "Sello de aprobado" },
  { id: "monedas", name: "Bolsa de monedas" },
  { id: "laptop", name: "Laptop" },
  { id: "bellota", name: "Bellota" },
] as const;

export interface Look {
  head: string;
  face: string;
  beard: string;
  hand: string;
}

export type LookPart = keyof Look;

export const PARTS: Record<LookPart, readonly { id: string; name: string }[]> = {
  head: HEADS,
  face: FACES,
  beard: BEARDS,
  hand: HANDS,
};

export const DEFAULT_LOOK = "ninguno|lentes|ninguna|lapizgigante";

export function parseLook(value: string | null | undefined): Look {
  const [head, face, beard, hand] = String(value || DEFAULT_LOOK).split("|");
  const ok = (part: LookPart, id: string | undefined, fallback: string) =>
    PARTS[part].some((p) => p.id === id) ? (id as string) : fallback;
  return {
    head: ok("head", head, "ninguno"),
    face: ok("face", face, "ninguna"),
    beard: ok("beard", beard, "ninguna"),
    hand: ok("hand", hand, "ninguno"),
  };
}

export function composeLook(l: Look): string {
  return `${l.head}|${l.face}|${l.beard}|${l.hand}`;
}

/** Strict check used by the API (the stored text must be exactly a valid look). */
export function isValidLook(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split("|");
  if (parts.length !== 4) return false;
  const [head, face, beard, hand] = parts;
  return (
    HEADS.some((h) => h.id === head) &&
    FACES.some((f) => f.id === face) &&
    BEARDS.some((b) => b.id === beard) &&
    HANDS.some((h) => h.id === hand)
  );
}

export function lookName(value: string): string {
  const l = parseLook(value);
  const names = (Object.keys(PARTS) as LookPart[])
    .map((k) => PARTS[k].find((p) => p.id === l[k]))
    .filter((p) => p && !["ninguno", "ninguna"].includes(p.id))
    .map((p) => p!.name);
  return names.length ? names.join(" · ") : "Sin accesorios";
}

export function randomLook(r: () => number = Math.random): string {
  const pick = (list: readonly { id: string }[], none: number) =>
    r() < none ? list[0].id : list[1 + Math.floor(r() * (list.length - 1))].id;
  return composeLook({
    head: pick(HEADS, 0.08),
    face: pick(FACES, 0.45),
    beard: pick(BEARDS, 0.55),
    hand: pick(HANDS, 0.15),
  });
}
