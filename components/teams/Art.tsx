/**
 * Flat SVG art for the Teams de Ardillas (11Diez style).
 * Pure SVG (no hooks, no <text>, no transforms) so the same components render in the
 * browser and inside the share images (next/og).
 */


/** Team flag: banner in the team color with a white accounting icon. viewBox 0 0 120 100. */
export function Flag({ kind, color, size = 96 }: { kind: string; color: string; size?: number }) {
  return (
    <svg width={size} height={(size * 100) / 120} viewBox="0 0 120 100">
      {/* Asta */}
      <path d="M10 4 L16 4 L16 100 L10 100 Z" fill="#6B4A2E" />
      <circle cx="13" cy="5" r="5" fill="#E2B12F" />
      {/* Paño con ondita */}
      <path d="M16 10 L112 10 C106 34 106 52 112 76 L16 76 Z" fill={color} />
      <path d="M16 70 L110 70 C110.5 72 111 74 112 76 L16 76 Z" fill="#000000" fillOpacity="0.15" />
      {FlagIcon({ kind })}
    </svg>
  );
}

const W = "#FFFFFF";

export function FlagIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "partida-doble": // balanza Debe | Haber
      return (
        <g>
          <path d="M61 20 L65 20 L65 62 L61 62 Z" fill={W} />
          <path d="M50 62 L76 62 L76 66 L50 66 Z" fill={W} />
          <path d="M36 26 L90 26 L90 30 L36 30 Z" fill={W} />
          <path d="M38 30 L30 46 L46 46 Z" fill="none" stroke={W} strokeWidth="2.5" />
          <path d="M28 46 C30 54 46 54 48 46 Z" fill={W} />
          <path d="M88 30 L80 46 L96 46 Z" fill="none" stroke={W} strokeWidth="2.5" />
          <path d="M78 46 C80 54 96 54 98 46 Z" fill={W} />
        </g>
      );
    case "balance-general": // Activo = Pasivo + Patrimonio
      return (
        <g>
          <path d="M28 24 L44 24 L44 62 L28 62 Z" fill={W} />
          <path d="M50 38 L58 38 L58 41 L50 41 Z M50 45 L58 45 L58 48 L50 48 Z" fill={W} />
          <path d="M64 40 L80 40 L80 62 L64 62 Z" fill={W} fillOpacity="0.85" />
          <path d="M84 49 L92 49 M88 45 L88 53" stroke={W} strokeWidth="3" />
          <path d="M64 24 L80 24 L80 36 L64 36 Z" fill={W} fillOpacity="0.6" />
        </g>
      );
    case "niif": // libro abierto con globo
      return (
        <g>
          <path d="M26 34 C36 30 50 30 60 36 L60 66 C50 60 36 60 26 64 Z" fill={W} />
          <path d="M94 34 C84 30 70 30 60 36 L60 66 C70 60 84 60 94 64 Z" fill={W} fillOpacity="0.85" />
          <circle cx="60" cy="26" r="11" fill="none" stroke={W} strokeWidth="2.6" />
          <path d="M49 26 L71 26 M60 15 C54 20 54 32 60 37 M60 15 C66 20 66 32 60 37" fill="none" stroke={W} strokeWidth="2" />
        </g>
      );
    case "conciliacion": // dos documentos con check
      return (
        <g>
          <path d="M30 22 L56 22 L56 60 L30 60 Z" fill={W} fillOpacity="0.75" />
          <path d="M46 28 L80 28 L80 66 L46 66 Z" fill={W} />
          <path d="M52 36 L72 36 M52 43 L68 43" stroke="#9A9A9A" strokeWidth="2.5" />
          <circle cx="84" cy="56" r="12" fill="#3FAE5A" stroke={W} strokeWidth="3" />
          <path d="M78 56 L82 60 L90 51" fill="none" stroke={W} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "cierre-fiscal": // calendario con check
      return (
        <g>
          <path d="M32 24 L88 24 L88 66 L32 66 Z" fill={W} />
          <path d="M32 24 L88 24 L88 36 L32 36 Z" fill="#000000" fillOpacity="0.25" />
          <path d="M42 18 L42 30 M78 18 L78 30" stroke={W} strokeWidth="4" strokeLinecap="round" />
          <path d="M48 50 L57 58 L74 42" fill="none" stroke="#3B5B28" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case "libro-mayor": // cuenta T
      return (
        <g>
          <path d="M26 22 L94 22 L94 28 L26 28 Z" fill={W} />
          <path d="M57 28 L63 28 L63 66 L57 66 Z" fill={W} />
          <path d="M32 38 L50 38 M32 46 L50 46 M32 54 L46 54" stroke={W} strokeWidth="3" strokeLinecap="round" />
          <path d="M70 38 L88 38 M70 46 L84 46" stroke={W} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "calculadora": // calculadora dorada
      return (
        <g>
          <path d="M42 18 L78 18 L78 68 L42 68 Z" fill="#F2C850" stroke={W} strokeWidth="3" />
          <path d="M48 24 L72 24 L72 34 L48 34 Z" fill="#3B5B28" />
          {[0, 1, 2].map((c) =>
            [0, 1, 2].map((r) => (
              <path
                key={`${c}${r}`}
                d={`M${48 + c * 9} ${39 + r * 9} h6 v6 h-6 Z`}
                fill={W}
              />
            )),
          )}
        </g>
      );
    case "sello": // sello de auditoría
      return (
        <g>
          <circle cx="60" cy="43" r="25" fill="none" stroke={W} strokeWidth="4" />
          <circle cx="60" cy="43" r="18" fill="none" stroke={W} strokeWidth="2" strokeDasharray="4 3" />
          <path d="M49 43 L57 51 L72 35" fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case "sindicato": // megáfono de protesta
      return (
        <g>
          <path d="M36 36 L56 36 L80 21 L80 65 L56 50 L36 50 Z" fill={W} />
          <path d="M33 34 L38 34 L38 52 L33 52 Z" fill={W} fillOpacity="0.85" />
          <path d="M45 50 L50 63 L57 63 L54 50 Z" fill={W} fillOpacity="0.85" />
          <path d="M87 33 C92 38 92 48 87 53" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" />
          <path d="M93 27 C101 36 101 50 93 59" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "exogena": // carpeta que se envía
      return (
        <g>
          <path d="M30 26 L50 26 L56 32 L90 32 L90 66 L30 66 Z" fill={W} fillOpacity="0.7" />
          <path d="M30 38 L90 38 L90 66 L30 66 Z" fill={W} />
          <path d="M60 61 L60 44 M52 51 L60 43 L68 51" fill="none" stroke="#000000" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "debi": // gafas rectangulares y corbata
      return (
        <g>
          <path d="M30 22 L54 22 L54 38 L30 38 Z M66 22 L90 22 L90 38 L66 38 Z" fill={W} fillOpacity="0.25" stroke={W} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M54 29 L66 29" stroke={W} strokeWidth="4" />
          <path d="M55 46 L65 46 L63 53 L57 53 Z" fill={INK} stroke={W} strokeWidth="2" strokeLinejoin="round" />
          <path d="M57 53 L63 53 L67 66 L60 72 L53 66 Z" fill={INK} stroke={W} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    case "credi": // gafas cat-eye y collar de perlas
      return (
        <g>
          <path d="M26 20 L34 27 Q45 25 54 29 Q53 41 43 42 Q32 42 30 31 Z" fill={W} fillOpacity="0.25" stroke={W} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M94 20 L86 27 Q75 25 66 29 Q67 41 77 42 Q88 42 90 31 Z" fill={W} fillOpacity="0.25" stroke={W} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M54 31 Q60 27 66 31" fill="none" stroke={W} strokeWidth="3" />
          {PEARLS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.4" fill={W} />
          ))}
        </g>
      );
    case "nuez": // la moneda nuez
      return (
        <g>
          <circle cx="60" cy="43" r="26" fill={W} />
          <circle cx="60" cy="43" r="21" fill="#F26522" />
          <path d="M51 41 Q51 57 60 61 Q69 57 69 41 Z" fill={W} />
          <path d="M48 41 Q48 29 60 29 Q72 29 72 41 Z" fill="#8A4B22" stroke={W} strokeWidth="2" />
          <path d="M60 29 L62 24" stroke={W} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "balance-rojo": // $ rojo que gotea
      return (
        <g>
          <path d="M60 16 L60 66" stroke={RED} strokeWidth="6" strokeLinecap="round" />
          <path d="M75 30 C71 22 50 21 47 31 C44 41 74 41 74 53 C74 64 51 65 44 56" fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" />
          <path d="M60 66 L60 70" stroke={RED} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="72.5" r="2.8" fill={RED} />
          <path d="M45 57 L45 63" stroke={RED} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="45" cy="65.5" r="2.4" fill={RED} />
        </g>
      );
    case "ringo": // antifaz de mapache y diente de oro
      return (
        <g>
          <path d="M24 33 Q40 20 60 30 Q80 20 96 33 Q92 48 75 46 Q66 44 60 48 Q54 44 45 46 Q28 48 24 33 Z" fill={INK} stroke={W} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="45" cy="36" r="6" fill={W} />
          <circle cx="75" cy="36" r="6" fill={W} />
          <circle cx="46" cy="37" r="2.8" fill={INK} />
          <circle cx="74" cy="37" r="2.8" fill={INK} />
          <path d="M42 56 Q60 68 78 56" fill="none" stroke={W} strokeWidth="4" strokeLinecap="round" />
          <path d="M62 60 L69 59 L69 66 L62 66 Z" fill="#F2C850" stroke={W} strokeWidth="1.5" />
        </g>
      );
    case "avellana": // aro de llaves antiguas
      return (
        <g>
          <circle cx="60" cy="27" r="12" fill="none" stroke={W} strokeWidth="4" />
          {[
            [44, 44],
            [60, 46],
            [76, 44],
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M60 39 L${x} ${y - 6}`} stroke={W} strokeWidth="2" />
              <circle cx={x} cy={y} r="5.5" fill="none" stroke={W} strokeWidth="3" />
              <path d={`M${x} ${y + 5} L${x} ${y + 24}`} stroke={W} strokeWidth="3.5" strokeLinecap="round" />
              <path d={`M${x} ${y + 17} L${x + 5} ${y + 17} M${x} ${y + 22} L${x + 5} ${y + 22}`} stroke={W} strokeWidth="3" />
            </g>
          ))}
        </g>
      );
    case "rompenueces": // cascanueces partiendo una nuez
      return (
        <g>
          <path d="M60 20 L40 70 M60 20 L80 70" stroke={W} strokeWidth="7" strokeLinecap="round" />
          <circle cx="60" cy="20" r="6" fill={W} />
          <circle cx="60" cy="47" r="8" fill="#C8742F" stroke={W} strokeWidth="2.5" />
          <path d="M57 42 L61 47 L58 52" fill="none" stroke={INK} strokeWidth="1.8" />
          <path d="M34 40 L40 43 M86 40 L80 43 M36 52 L42 51 M84 52 L78 51" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "clan-bellota": // escudo con bellota
      return (
        <g>
          <path d="M38 17 L82 17 L82 42 Q82 61 60 72 Q38 61 38 42 Z" fill={W} />
          <path d="M51 41 Q51 57 60 61 Q69 57 69 41 Z" fill="#C8742F" />
          <path d="M48 41 Q48 29 60 29 Q72 29 72 41 Z" fill="#8A4B22" />
          <path d="M60 29 L62 24" stroke="#8A4B22" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "escuadron-bellota": // bellota con antifaz
      return (
        <g>
          <path d="M41 36 Q41 63 60 72 Q79 63 79 36 Z" fill={W} />
          <path d="M37 37 Q37 18 60 18 Q83 18 83 37 Z" fill={W} fillOpacity="0.8" />
          <path d="M60 18 L63 12" stroke={W} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M42 41 Q60 37 78 41 L78 52 Q60 48 42 52 Z" fill={INK} />
          <ellipse cx="51" cy="45.5" rx="4" ry="3" fill={W} />
          <ellipse cx="69" cy="45.5" rx="4" ry="3" fill={W} />
          <path d="M78 43 L92 38 M78 50 L92 55" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

const INK = "#1E1E1E";
const RED = "#E0283E";
/** Perlas del collar de Credi, en arco. */
const PEARLS: [number, number][] = Array.from({ length: 9 }, (_, i) => {
  const t = Math.PI * (0.12 + (0.76 * i) / 8);
  return [Math.round((60 + 27 * Math.cos(t)) * 10) / 10, Math.round((50 + 16 * Math.sin(t)) * 10) / 10];
});
