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

function FlagIcon({ kind }: { kind: string }) {
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
    default:
      return null;
  }
}
