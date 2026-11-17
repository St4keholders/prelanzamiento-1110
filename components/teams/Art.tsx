/**
 * Flat SVG art for the Teams de Ardillas (11Diez style).
 * Pure SVG (no hooks, no <text>, no transforms) so the same components render in the
 * browser and inside the share images (next/og).
 */

const FUR = "#D9783A";
const FUR_DARK = "#B85C25";
const FUR_LIGHT = "#F6DFC0";
const INK = "#2A1C14";
const CHEEK = "#F2A0A0";

/** Squirrel head avatar with the accessory of each "ardilla". viewBox 0 0 120 120. */
export function Squirrel({ kind, size = 96 }: { kind: string; size?: number }) {
  const glasses = kind === "clasica" || kind === "senior" || kind === "analista";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {/* Cola detrás */}
      <path
        d="M92 98 C120 92 122 52 104 36 C96 29 84 30 82 40 C96 42 104 58 98 74 C95 84 88 92 80 96 Z"
        fill={FUR_DARK}
      />
      <path d="M96 44 C106 52 108 66 102 78 C100 70 98 60 92 52 Z" fill="#E9A866" />
      {/* Orejas */}
      <path d="M30 40 L26 14 C36 14 44 24 46 34 Z" fill={FUR} />
      <path d="M32 36 L30 21 C36 22 40 28 41 33 Z" fill={CHEEK} />
      <path d="M90 40 L94 14 C84 14 76 24 74 34 Z" fill={FUR} />
      <path d="M88 36 L90 21 C84 22 80 28 79 33 Z" fill={CHEEK} />
      {/* Cabeza */}
      <ellipse cx="60" cy="64" rx="38" ry="34" fill={FUR} />
      <ellipse cx="60" cy="76" rx="27" ry="21" fill={FUR_LIGHT} />
      <ellipse cx="38" cy="78" rx="6" ry="4" fill={CHEEK} />
      <ellipse cx="82" cy="78" rx="6" ry="4" fill={CHEEK} />
      {/* Ojos */}
      <ellipse cx="46" cy="60" rx="8" ry="9" fill="#FFFFFF" />
      <ellipse cx="74" cy="60" rx="8" ry="9" fill="#FFFFFF" />
      <circle cx="47" cy="61" r="5" fill={INK} />
      <circle cx="73" cy="61" r="5" fill={INK} />
      <circle cx="49" cy="59" r="1.8" fill="#FFFFFF" />
      <circle cx="75" cy="59" r="1.8" fill="#FFFFFF" />
      {glasses && (
        <g>
          <circle cx="46" cy="60" r="11" fill="none" stroke={INK} strokeWidth="3" />
          <circle cx="74" cy="60" r="11" fill="none" stroke={INK} strokeWidth="3" />
          <path d="M57 59 L63 59" stroke={INK} strokeWidth="3" />
        </g>
      )}
      {/* Nariz, boca y dientes */}
      <ellipse cx="60" cy="72" rx="4.5" ry="3.2" fill="#C9656A" />
      <path d="M52 78 C56 84 64 84 68 78" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M57 80 L57 86 L63 86 L63 80 Z" fill="#FFFFFF" />
      <path d="M60 80 L60 86" stroke="#E0D4C4" strokeWidth="1" />

      {Accessory({ kind })}
    </svg>
  );
}

function Accessory({ kind }: { kind: string }) {
  switch (kind) {
    case "clasica": // lápiz sobre la oreja
      return (
        <g>
          <path d="M14 30 L44 18 L47 25 L17 37 Z" fill="#F2C850" />
          <path d="M14 30 L17 37 L8 37 Z" fill="#F4D9B0" />
          <path d="M44 18 L50 16 L53 22 L47 25 Z" fill="#E88B9A" />
        </g>
      );
    case "auditora": // lupa
      return (
        <g>
          <path d="M98 104 L112 118" stroke="#6B4A2E" strokeWidth="7" strokeLinecap="round" />
          <circle cx="90" cy="96" r="13" fill="#DDF0F5" stroke="#3B5B28" strokeWidth="5" />
          <path d="M84 92 C86 88 90 87 93 88" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "tributaria": // calculadora
      return (
        <g>
          <path d="M80 84 L112 84 L112 118 L80 118 Z" fill="#3B5B28" />
          <path d="M85 89 L107 89 L107 97 L85 97 Z" fill="#E1E797" />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => (
              <path
                key={`${c}${r}`}
                d={`M${85 + c * 8} ${101 + r * 8} h6 v5 h-6 Z`}
                fill={c === 2 && r === 1 ? "#E8692B" : "#FFFFFF"}
              />
            )),
          )}
        </g>
      );
    case "senior": // camisa y corbata
      return (
        <g>
          <path d="M34 96 L60 104 L86 96 L92 120 L28 120 Z" fill="#FFFFFF" />
          <path d="M56 102 L64 102 L62 108 L66 120 L54 120 L58 108 Z" fill="#2B5932" />
          <path d="M28 120 L34 96 L44 99 L42 120 Z" fill="#3B5B28" />
          <path d="M92 120 L86 96 L76 99 L78 120 Z" fill="#3B5B28" />
        </g>
      );
    case "analista": // gráfica de barras
      return (
        <g>
          <path d="M78 86 L114 86 L114 118 L78 118 Z" fill="#FFFFFF" stroke="#3B5B28" strokeWidth="3" />
          <path d="M84 110 L90 110 L90 102 L84 102 Z" fill="#8FA83A" />
          <path d="M93 110 L99 110 L99 96 L93 96 Z" fill="#E2B12F" />
          <path d="M102 110 L108 110 L108 91 L102 91 Z" fill="#E8692B" />
        </g>
      );
    case "tesorera": // monedas
      return (
        <g>
          <circle cx="96" cy="104" r="14" fill="#E2B12F" stroke="#B88A14" strokeWidth="3" />
          <path
            d="M100 98 C98 95 91 95 91 100 C91 105 101 103 101 108 C101 113 93 113 91 110 M96 93 L96 115"
            fill="none"
            stroke="#8A6A0A"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="76" cy="112" r="8" fill="#F2C850" stroke="#B88A14" strokeWidth="2.5" />
        </g>
      );
    case "revisora": // sello de aprobado
      return (
        <g>
          <path d="M88 82 L104 82 L104 94 L88 94 Z" fill="#6B4A2E" />
          <path d="M80 94 L112 94 L112 104 L80 104 Z" fill="#C0392B" />
          <circle cx="96" cy="112" r="7" fill="none" stroke="#C0392B" strokeWidth="2.5" />
          <path d="M92 112 L95 115 L100 109" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "practicante": // café y post-it
      return (
        <g>
          <path d="M8 88 L30 88 L30 110 L8 110 Z" fill="#F2E55C" />
          <path d="M12 95 L26 95 M12 101 L22 101" stroke="#B8A82A" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M84 92 L106 92 L103 118 L87 118 Z" fill="#FFFFFF" stroke="#6B4A2E" strokeWidth="3" />
          <path d="M106 98 C114 98 114 110 104 110" fill="none" stroke="#6B4A2E" strokeWidth="3" />
          <path d="M84 92 L106 92 L106 98 L84 98 Z" fill="#8A4B22" />
        </g>
      );
    default:
      return null;
  }
}

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
