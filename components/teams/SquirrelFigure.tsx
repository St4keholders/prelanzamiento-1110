/**
 * Ardilla 11Diez por capas (SVG plano). Combina estilo (ardillo/ardilla) + ropa + cabeza +
 * cara + barba/aretes + accesorio en la mano; la ropa toma el color del team. Solo elementos SVG intrínsecos y funciones (no
 * subcomponentes) para que también funcione dentro de las imágenes de next/og.
 */
import { type Look, parseLook } from "@/lib/squirrel-look";

const FUR = "#D9783A";
const FUR_DARK = "#B85C25";
const FUR_LIGHT = "#F6DFC0";
const INK = "#2A1C14";
const CHEEK = "#F2A0A0";
const WHITE = "#FFFFFF";
const GOLD = "#E2B12F";
const GOLD_DARK = "#B88A14";
const HAIR = "#6B3A1E";
const HAIR_LIGHT = "#8F5129";
const PINK = "#E84A8A";
const PINK_DARK = "#C2306B";
const LEAF = "#5C9A3A";

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Florecita de 5 pétalos. */
function flower(cx: number, cy: number, petal: string, size = 1, key?: string | number) {
  return (
    <g key={key}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 - 90) * (Math.PI / 180);
        return (
          <circle
            key={i}
            cx={r1(cx + Math.cos(a) * 5 * size)}
            cy={r1(cy + Math.sin(a) * 5 * size)}
            r={r1(4.6 * size)}
            fill={petal}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r1(3.4 * size)} fill="#F2C850" />
    </g>
  );
}

/** Corazón centrado en (cx, cy) de ancho ~2·w. */
function heartPath(cx: number, cy: number, w: number) {
  const h = w * 0.8;
  return `M${cx} ${r1(cy + h)} C${r1(cx - w * 1.4)} ${r1(cy - h * 0.1)} ${r1(cx - w * 0.8)} ${r1(cy - h * 1.3)} ${cx} ${r1(cy - h * 0.45)} C${r1(cx + w * 0.8)} ${r1(cy - h * 1.3)} ${r1(cx + w * 1.4)} ${r1(cy - h * 0.1)} ${cx} ${r1(cy + h)} Z`;
}

/** Estrella de 5 puntas. */
function starPath(cx: number, cy: number, R: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 - 90) * (Math.PI / 180);
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${r1(cx + Math.cos(a) * rad)} ${r1(cy + Math.sin(a) * rad)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** viewBox completo (cuerpo) y recorte de la cabeza para miniaturas de cara/barba. */
const VIEW_FULL = "0 -12 200 242";
const VIEW_HEAD = "34 18 132 116";

export function SquirrelFigure({
  look,
  color,
  size = 160,
  crop = "full",
}: {
  look: string | Look;
  color: string;
  size?: number;
  crop?: "full" | "head";
}) {
  const l = typeof look === "string" ? parseLook(look) : look;
  const fem = l.style === "ardilla";
  const head = crop === "head";
  return (
    <svg
      width={size}
      height={head ? size * (116 / 132) : size * (242 / 200)}
      viewBox={head ? VIEW_HEAD : VIEW_FULL}
    >
      {tail()}
      {body(color, l.outfit)}
      {hairBack(l.head)}
      {ears()}
      {faceBase(fem)}
      {beard(l.beard)}
      {face(l.face, fem)}
      {hat(l.head)}
      {hand(l.hand)}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

function tail() {
  return (
    <g>
      <path
        d="M126 202 C176 198 200 150 188 102 C180 66 150 44 128 52 C112 58 110 78 126 84 C146 92 160 112 156 142 C152 170 140 188 122 194 Z"
        fill={FUR_DARK}
      />
      <path
        d="M134 60 C152 58 172 74 178 100 C184 128 174 160 152 182 C164 158 168 128 162 108 C156 88 144 74 134 60 Z"
        fill="#E9A866"
      />
    </g>
  );
}

/** Silueta del torso (blusa, suéter). */
const TORSO =
  "M58 150 C58 134 74 128 100 128 C126 128 142 134 142 150 C146 172 142 196 132 210 L68 210 C58 196 54 172 58 150 Z";

function shade(d: string, opacity = 0.22) {
  return <path d={d} fill="#000000" fillOpacity={opacity} />;
}

function vest(color: string) {
  return (
    <g>
      <path d="M80 128 L120 128 L106 176 L94 176 Z" fill={WHITE} />
      <path
        d="M58 150 C58 136 70 128 82 128 L100 176 L100 214 L68 210 C58 192 56 170 58 150 Z"
        fill={color}
      />
      <path
        d="M142 150 C142 136 130 128 118 128 L100 176 L100 214 L132 210 C142 192 144 170 142 150 Z"
        fill={color}
      />
      <path d="M100 176 L100 214" stroke="#000000" strokeOpacity="0.18" strokeWidth="2" />
      <circle cx="107" cy="188" r="2.6" fill="#000000" fillOpacity="0.25" />
      <circle cx="107" cy="200" r="2.6" fill="#000000" fillOpacity="0.25" />
    </g>
  );
}

function bowTie(fill: string, cy = 136) {
  return (
    <g>
      <path d={`M100 ${cy} L86 ${cy - 8} L86 ${cy + 8} Z`} fill={fill} />
      <path d={`M100 ${cy} L114 ${cy - 8} L114 ${cy + 8} Z`} fill={fill} />
      <circle cx="100" cy={cy} r="4" fill={fill} />
    </g>
  );
}

function outfit(color: string, id: string) {
  switch (id) {
    case "corbatin":
      return (
        <g>
          {vest(color)}
          {bowTie(INK)}
        </g>
      );
    case "sueter":
      return (
        <g>
          <path d={TORSO} fill={color} />
          <path d="M57 158 L143 158 L143.6 164 L56.6 164 Z M57 172 L143.6 172 L143.4 178 L57 178 Z" fill={WHITE} fillOpacity="0.85" />
          <path d="M78 128 C84 142 116 142 122 128 L116 126 C110 134 90 134 84 126 Z" fill={color} />
          {shade("M78 128 C84 142 116 142 122 128 L116 126 C110 134 90 134 84 126 Z", 0.28)}
          {flower(100, 194, WHITE, 0.8)}
        </g>
      );
    case "blusa": {
      const loops = "M100 140 C90 128 74 128 76 141 C74 154 90 152 100 140 Z M100 140 C110 128 126 128 124 141 C126 154 110 152 100 140 Z";
      const tails = "M97 143 L88 166 L95 162 L100 145 Z M103 143 L112 166 L105 162 L100 145 Z";
      return (
        <g>
          <path d={TORSO} fill={color} />
          <path d={`${loops} ${tails}`} fill={WHITE} />
          <path d="M100 140 C94 134 84 133 82 139 M100 140 C106 134 116 133 118 139" fill="none" stroke="#D8D0C2" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="140" r="5" fill="#EFEAE2" />
          <circle cx="100" cy="178" r="2.4" fill={WHITE} />
          <circle cx="100" cy="191" r="2.4" fill={WHITE} />
          <circle cx="100" cy="204" r="2.4" fill={WHITE} />
        </g>
      );
    }
    case "vestido": {
      const dress = "M64 146 C64 134 80 128 100 128 C120 128 136 134 136 146 L132 178 L158 214 L42 214 L68 178 Z";
      return (
        <g>
          <path d={dress} fill={color} />
          <path d="M86 128 C90 142 110 142 114 128 Z" fill={FUR_LIGHT} />
          <path d="M67 176 L133 176 L132.4 184 L67.6 184 Z" fill={WHITE} />
          {[
            [86, 152], [112, 148], [98, 164], [120, 164], [78, 166],
            [64, 204], [80, 196], [96, 206], [112, 196], [128, 206], [144, 204], [72, 190], [100, 192], [126, 190],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" fill={WHITE} fillOpacity="0.9" />
          ))}
          {shade("M42 214 L158 214 L155 210 L45 210 Z", 0.2)}
        </g>
      );
    }
    case "blazer": {
      const pearls = [
        [86, 131], [90, 136], [95, 139.5], [100, 141], [105, 139.5], [110, 136], [114, 131],
      ];
      const lapels = "M82 128 L100 170 L88 152 L74 146 Z M118 128 L100 170 L112 152 L126 146 Z";
      return (
        <g>
          <path d="M80 128 L120 128 L106 176 L94 176 Z" fill={WHITE} />
          <path d="M54 150 C54 134 68 128 82 128 L100 170 L100 214 L66 212 C54 194 50 170 54 150 Z" fill={color} />
          <path d="M146 150 C146 134 132 128 118 128 L100 170 L100 214 L134 212 C146 194 150 170 146 150 Z" fill={color} />
          {shade(lapels, 0.25)}
          <path d="M100 170 L100 214" stroke="#000000" strokeOpacity="0.18" strokeWidth="2" />
          <circle cx="104" cy="186" r="3" fill={GOLD} />
          <circle cx="104" cy="198" r="3" fill={GOLD} />
          {pearls.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3.2" fill={WHITE} stroke="#D8D0C2" strokeWidth="1" />
          ))}
        </g>
      );
    }
    case "falda":
      return (
        <g>
          {vest(color)}
          <path d="M66 190 L134 190 L152 214 L48 214 Z" fill={color} />
          {shade("M66 190 L134 190 L152 214 L48 214 Z", 0.28)}
          <path d="M80 192 L74 213 M100 192 L100 213 M120 192 L126 213" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" />
          {bowTie(PINK, 134)}
        </g>
      );
    default: // chaleco
      return (
        <g>
          {vest(color)}
          <path d="M96 130 L104 130 L102 138 L106 162 L100 170 L94 162 L98 138 Z" fill={INK} />
        </g>
      );
  }
}

function body(color: string, outfitId: string) {
  return (
    <g>
      {/* pies */}
      <ellipse cx="80" cy="219" rx="17" ry="8" fill={INK} />
      <ellipse cx="120" cy="219" rx="17" ry="8" fill={INK} />
      {/* cuerpo */}
      <ellipse cx="100" cy="172" rx="46" ry="46" fill={FUR} />
      {outfit(color, outfitId)}
      {/* brazo izquierdo */}
      <ellipse cx="57" cy="172" rx="11" ry="19" fill={FUR} />
      <ellipse cx="56" cy="186" rx="9" ry="7" fill={FUR_DARK} />
    </g>
  );
}

function ears() {
  return (
    <g>
      <path d="M62 52 L50 12 C68 12 82 28 86 44 Z" fill={FUR} />
      <path d="M64 46 L57 22 C68 24 76 33 79 42 Z" fill={CHEEK} />
      <path d="M138 52 L150 12 C132 12 118 28 114 44 Z" fill={FUR} />
      <path d="M136 46 L143 22 C132 24 124 33 121 42 Z" fill={CHEEK} />
    </g>
  );
}

function eyes(fem = false) {
  return (
    <g>
      <ellipse cx="83" cy="80" rx="11" ry="12" fill={WHITE} />
      <ellipse cx="117" cy="80" rx="11" ry="12" fill={WHITE} />
      <circle cx="84" cy="81" r="6.5" fill={INK} />
      <circle cx="116" cy="81" r="6.5" fill={INK} />
      <circle cx="86.5" cy="78" r="2.4" fill={WHITE} />
      <circle cx="118.5" cy="78" r="2.4" fill={WHITE} />
      {fem ? (
        <path
          d="M72 77 C73 66 93 65 95 75 M74 71 L67 66 M77.5 68 L73 61.5 M82 67 L80.5 60 M128 77 C127 66 107 65 105 75 M126 71 L133 66 M122.5 68 L127 61.5 M118 67 L119.5 60"
          fill="none"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}

function mouth(fem = false) {
  return (
    <g>
      <path
        d="M88 103 C94 112 106 112 112 103"
        fill="none"
        stroke={fem ? "#D63E6C" : INK}
        strokeWidth={fem ? 4 : 3}
        strokeLinecap="round"
      />
      <path d="M96 107 L96 115 L104 115 L104 107 Z" fill={WHITE} />
      <path d="M100 107 L100 115" stroke="#E0D4C4" strokeWidth="1" />
    </g>
  );
}

function faceBase(fem: boolean) {
  const blush = fem ? "#F48CA6" : CHEEK;
  return (
    <g>
      <ellipse cx="100" cy="82" rx="52" ry="46" fill={FUR} />
      <ellipse cx="83" cy="80" rx="17" ry="17" fill={FUR_LIGHT} />
      <ellipse cx="117" cy="80" rx="17" ry="17" fill={FUR_LIGHT} />
      <ellipse cx="100" cy="102" rx="34" ry="24" fill={FUR_LIGHT} />
      <ellipse cx="70" cy="102" rx={fem ? 10 : 8} ry={fem ? 6 : 5} fill={blush} />
      <ellipse cx="130" cy="102" rx={fem ? 10 : 8} ry={fem ? 6 : 5} fill={blush} />
      {eyes(fem)}
      <ellipse cx="100" cy="95" rx="6" ry="4.2" fill="#C9656A" />
      {mouth(fem)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Barba
// ---------------------------------------------------------------------------

function mustache(fill: string) {
  return (
    <path
      d="M100 99 C92 95 80 97 75 106 C84 103 92 106 100 103 C108 106 116 103 125 106 C120 97 108 95 100 99 Z"
      fill={fill}
    />
  );
}

function beard(id: string) {
  const BROWN = "#5A3420";
  switch (id) {
    case "bigote":
      return mustache(BROWN);
    case "frances":
      return (
        <path
          d="M100 100 C92 98 84 101 80 104 C76 106 72 104 72 100 M100 100 C108 98 116 101 120 104 C124 106 128 104 128 100"
          fill="none"
          stroke={BROWN}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );
    case "barba":
      return (
        <g>
          <path d="M64 96 C62 138 84 162 100 164 C116 162 138 138 136 96 C126 112 114 118 100 118 C86 118 74 112 64 96 Z" fill={BROWN} />
          {mustache(BROWN)}
          <path d="M92 110 C96 114 104 114 108 110" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "blanca":
      return (
        <g>
          <path d="M62 94 C56 128 74 160 100 168 C126 160 144 128 138 94 C128 112 114 120 100 120 C86 120 72 112 62 94 Z" fill="#F4F1EC" />
          <path d="M76 132 C82 140 90 146 98 148 M124 132 C118 140 110 146 102 148" fill="none" stroke="#D9D2C6" strokeWidth="2" />
          {mustache("#FFFFFF")}
          <path d="M92 110 C96 114 104 114 108 110" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "candado":
      return (
        <g>
          {mustache(BROWN)}
          <path d="M88 116 C90 130 96 136 100 136 C104 136 110 130 112 116 C106 120 94 120 88 116 Z" fill={BROWN} />
        </g>
      );
    case "patillas":
      return (
        <g>
          <path d="M50 74 L60 74 L64 112 C58 110 53 104 51 96 Z" fill={BROWN} />
          <path d="M150 74 L140 74 L136 112 C142 110 147 104 149 96 Z" fill={BROWN} />
        </g>
      );
    case "perlas":
      return (
        <g>
          {[55, 145].map((x) => (
            <g key={x}>
              <circle cx={x} cy="108" r="5.5" fill={WHITE} stroke="#D8D0C2" strokeWidth="1.2" />
              <circle cx={x - 1.8} cy="106" r="1.6" fill={WHITE} />
            </g>
          ))}
        </g>
      );
    case "argollas":
      return (
        <g>
          {[54, 146].map((x) => (
            <g key={x}>
              <circle cx={x} cy="104" r="2.6" fill={GOLD} />
              <circle cx={x} cy="115" r="8.5" fill="none" stroke={GOLD} strokeWidth="3.2" />
            </g>
          ))}
        </g>
      );
    case "aretesbellota":
      return (
        <g>
          {[55, 145].map((x) => (
            <g key={x}>
              <path d={`M${x} 104 L${x} 111`} stroke={GOLD} strokeWidth="2" />
              <path d={`M${x - 6} 115 C${x - 6} 128 ${x + 6} 128 ${x + 6} 115 Z`} fill="#C98A4B" />
              <path d={`M${x - 7} 116 C${x - 7} 108 ${x + 7} 108 ${x + 7} 116 Z`} fill="#6B4A2E" />
            </g>
          ))}
        </g>
      );
    case "aretescorazon":
      return (
        <g>
          {[55, 145].map((x) => (
            <g key={x}>
              <path d={`M${x} 104 L${x} 110`} stroke={GOLD} strokeWidth="2" />
              <path d={heartPath(x, 116, 6)} fill={PINK} stroke={PINK_DARK} strokeWidth="1.2" />
            </g>
          ))}
        </g>
      );
    case "lunar":
      return <circle cx="123" cy="97" r="2.8" fill={INK} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Cara
// ---------------------------------------------------------------------------

function face(id: string, fem = false) {
  switch (id) {
    case "lentes":
      return (
        <g>
          <circle cx="83" cy="80" r="15" fill={WHITE} fillOpacity="0.15" stroke={INK} strokeWidth="4" />
          <circle cx="117" cy="80" r="15" fill={WHITE} fillOpacity="0.15" stroke={INK} strokeWidth="4" />
          <path d="M98 79 L102 79" stroke={INK} strokeWidth="4" />
          <path d="M68 76 L54 72 M132 76 L146 72" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "gafas":
      return (
        <g>
          <path d="M64 70 L100 70 L98 86 C96 96 70 96 67 86 Z" fill="#111111" />
          <path d="M100 70 L136 70 L133 86 C130 96 104 96 102 86 Z" fill="#111111" />
          <path d="M60 70 L140 70" stroke="#111111" strokeWidth="4" />
          <path d="M72 76 L80 76 M108 76 L116 76" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "monoculo":
      return (
        <g>
          <circle cx="117" cy="80" r="15" fill={WHITE} fillOpacity="0.2" stroke={GOLD} strokeWidth="4" />
          <path d="M130 88 C140 104 136 124 128 136" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );
    case "luchador":
      return (
        <g>
          <path
            d="M48 84 C46 50 70 36 100 36 C130 36 154 50 152 84 C140 92 128 90 118 96 L100 98 L82 96 C72 90 60 92 48 84 Z"
            fill="#C0392B"
          />
          <path d="M100 36 L100 62 M66 52 L80 64 M134 52 L120 64" stroke="#F2C850" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="83" cy="80" rx="15" ry="15" fill="#FFFFFF" />
          <ellipse cx="117" cy="80" rx="15" ry="15" fill="#FFFFFF" />
          {eyes(fem)}
        </g>
      );
    case "antifaz":
      return (
        <g>
          <path
            d="M52 72 C70 62 130 62 148 72 L146 90 C130 98 112 94 100 88 C88 94 70 98 54 90 Z"
            fill="#1B1B3A"
          />
          <path d="M52 76 L36 70 L40 82 Z" fill="#1B1B3A" />
          <ellipse cx="83" cy="80" rx="12" ry="12" fill="#FFFFFF" />
          <ellipse cx="117" cy="80" rx="12" ry="12" fill="#FFFFFF" />
          {eyes(fem)}
        </g>
      );
    case "parche":
      return (
        <g>
          <path d="M52 58 L148 100" stroke="#111111" strokeWidth="3" />
          <ellipse cx="83" cy="80" rx="14" ry="14" fill="#111111" />
        </g>
      );
    case "payaso":
      return (
        <g>
          <circle cx="100" cy="95" r="10" fill="#E0242C" />
          <circle cx="96" cy="91" r="3" fill="#FFFFFF" fillOpacity="0.7" />
        </g>
      );
    case "ojogato": {
      const FRAME = "#8E2C5A";
      return (
        <g>
          <ellipse cx="83" cy="81" rx="15" ry="13" fill={WHITE} fillOpacity="0.15" stroke={FRAME} strokeWidth="4" />
          <ellipse cx="117" cy="81" rx="15" ry="13" fill={WHITE} fillOpacity="0.15" stroke={FRAME} strokeWidth="4" />
          <path d="M70 76 L56 62 L74 69 Z M130 76 L144 62 L126 69 Z" fill={FRAME} />
          <path d="M98 79 L102 79" stroke={FRAME} strokeWidth="4" />
          <circle cx="62" cy="66" r="1.8" fill={WHITE} />
          <circle cx="138" cy="66" r="1.8" fill={WHITE} />
        </g>
      );
    }
    case "corazon":
      return (
        <g>
          <path d={`${heartPath(83, 82, 13)} ${heartPath(117, 82, 13)}`} fill={PINK} fillOpacity="0.88" stroke={PINK_DARK} strokeWidth="3" />
          <path d="M98 78 L102 78 M66 76 L54 72 M134 76 L146 72" stroke={PINK_DARK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M74 76 C76 73 79 72 82 73 M108 76 C110 73 113 72 116 73" fill="none" stroke={WHITE} strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "estrella":
      return (
        <g>
          <path d={`${starPath(83, 81, 19, 9)} ${starPath(117, 81, 19, 9)}`} fill="#F2C850" fillOpacity="0.9" stroke={GOLD_DARK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M98 79 L102 79" stroke={GOLD_DARK} strokeWidth="3.5" />
          <circle cx="83" cy="81" r="5" fill={INK} />
          <circle cx="117" cy="81" r="5" fill={INK} />
        </g>
      );
    case "pecas":
      return (
        <g>
          {[
            [66, 94], [72, 98], [64, 101], [76, 92],
            [134, 94], [128, 98], [136, 101], [124, 92],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={FUR_DARK} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Cabeza
// ---------------------------------------------------------------------------

function hairBack(id: string) {
  switch (id) {
    case "afro":
      return (
        <g>
          {[
            [100, 30, 40],
            [62, 44, 26],
            [138, 44, 26],
            [52, 72, 20],
            [148, 72, 20],
            [80, 22, 24],
            [120, 22, 24],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#2B1D14" />
          ))}
        </g>
      );
    case "pelolargo":
      return (
        <g>
          <path
            d="M54 60 C40 30 160 30 146 60 C156 90 162 122 158 148 C146 156 132 152 126 140 L74 140 C68 152 54 156 42 148 C38 122 44 90 54 60 Z"
            fill={HAIR}
          />
          <path d="M48 96 C46 116 48 132 52 144 M152 96 C154 116 152 132 148 144" fill="none" stroke={HAIR_LIGHT} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "coleta":
      return (
        <path
          d="M66 46 C40 38 22 62 26 92 C28 112 22 130 12 140 C38 140 52 120 52 98 C52 78 58 64 72 56 Z"
          fill={HAIR}
        />
      );
    case "coletas":
      return (
        <path
          d="M54 62 C30 52 12 70 16 94 C20 110 34 114 40 104 C36 92 40 80 54 76 Z M146 62 C170 52 188 70 184 94 C180 110 166 114 160 104 C164 92 160 80 146 76 Z"
          fill={HAIR}
        />
      );
    case "trenzas":
      return (
        <g>
          {[50, 150].map((x) => (
            <g key={x}>
              {[96, 108, 120, 132, 144].map((y, i) => (
                <ellipse key={y} cx={x + (i % 2 === 0 ? -1.5 : 1.5)} cy={y} rx="8" ry="7.5" fill={i % 2 === 0 ? HAIR : HAIR_LIGHT} />
              ))}
              <path d={`M${x} 156 L${x - 9} 150 L${x - 9} 162 Z M${x} 156 L${x + 9} 150 L${x + 9} 162 Z`} fill={PINK} />
              <circle cx={x} cy="156" r="3" fill={PINK_DARK} />
            </g>
          ))}
        </g>
      );
    case "rizos":
      return (
        <g>
          {[
            [58, 50], [74, 36], [92, 30], [108, 30], [126, 36], [142, 50],
            [50, 70], [150, 70], [46, 92], [154, 92], [48, 114], [152, 114],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="13" fill={HAIR} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Flequillo de pelo encima de la frente (para peinados). */
function fringe() {
  return (
    <path
      d="M54 66 C52 40 74 32 100 32 C126 32 148 40 146 66 C138 56 128 52 118 56 C114 46 104 44 98 50 C90 44 80 46 76 54 C68 50 60 54 54 66 Z"
      fill={HAIR}
    />
  );
}

function hat(id: string) {
  switch (id) {
    case "visera":
      return (
        <g>
          <path d="M48 60 C68 48 132 48 152 60 L152 68 C132 56 68 56 48 68 Z" fill="#1F6B35" />
          <path d="M54 64 C78 54 122 54 146 64 L156 82 C124 70 76 70 44 82 Z" fill="#3FAE5A" fillOpacity="0.85" />
          <path d="M44 82 C76 70 124 70 156 82" fill="none" stroke="#1F6B35" strokeWidth="2.5" />
        </g>
      );
    case "birrete":
      return (
        <g>
          <path d="M64 52 C64 40 136 40 136 52 L136 60 C120 54 80 54 64 60 Z" fill="#1E1E1E" />
          <path d="M100 18 L162 36 L100 54 L38 36 Z" fill="#2A2A2A" />
          <circle cx="100" cy="36" r="3.5" fill={GOLD} />
          <path d="M100 36 L150 44 L152 66" fill="none" stroke={GOLD} strokeWidth="2.5" />
          <path d="M148 64 L156 64 L154 76 L150 76 Z" fill={GOLD} />
        </g>
      );
    case "lapiz":
      return (
        <g>
          <path d="M116 44 L168 20 L172 28 L120 52 Z" fill="#F2C850" />
          <path d="M116 44 L120 52 L108 52 Z" fill="#F4D9B0" />
          <path d="M110 51 L108 52 L111 49 Z" fill={INK} />
          <path d="M168 20 L176 16 L180 24 L172 28 Z" fill="#E88B9A" />
        </g>
      );
    case "casco":
      return (
        <g>
          <path d="M52 60 C52 18 148 18 148 60 Z" fill="#F2C12E" />
          <path d="M40 58 L160 58 L160 68 L40 68 Z" fill="#E0A800" />
          <path d="M92 22 L108 22 L110 58 L90 58 Z" fill="#E0A800" />
        </g>
      );
    case "vueltiao":
      return (
        <g>
          <ellipse cx="100" cy="54" rx="76" ry="13" fill="#F3E7C9" />
          <ellipse cx="100" cy="54" rx="64" ry="9" fill="none" stroke="#1E1E1E" strokeWidth="2.5" />
          <ellipse cx="100" cy="54" rx="50" ry="6" fill="none" stroke="#1E1E1E" strokeWidth="2.5" />
          <path d="M70 52 C70 22 130 22 130 52 Z" fill="#F3E7C9" />
          <path d="M72 42 L128 42 M74 32 L126 32" stroke="#1E1E1E" strokeWidth="3" />
        </g>
      );
    case "gorra":
      return (
        <g>
          <path d="M54 60 C54 20 146 20 146 60 Z" fill="#D63333" />
          <path d="M120 56 C150 52 174 58 178 66 C160 68 136 66 120 62 Z" fill="#A82424" />
          <circle cx="100" cy="24" r="4" fill="#A82424" />
          <path d="M100 24 L100 58" stroke="#A82424" strokeWidth="2" />
        </g>
      );
    case "corona":
      return (
        <g>
          <path d="M60 52 L58 18 L76 34 L90 10 L100 32 L110 10 L124 34 L142 18 L140 52 Z" fill={GOLD} />
          <path d="M60 52 L140 52 L140 44 L60 44 Z" fill={GOLD_DARK} />
          <circle cx="80" cy="48" r="3.5" fill="#C0392B" />
          <circle cx="100" cy="48" r="3.5" fill="#1F6F78" />
          <circle cx="120" cy="48" r="3.5" fill="#C0392B" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M48 62 C68 42 132 42 152 62 L150 72 C130 56 70 56 50 72 Z" fill="#C0392B" />
          <path d="M50 66 L28 72 L34 86 L54 72 Z" fill="#A02E22" />
          <circle cx="78" cy="56" r="2.5" fill="#FFFFFF" />
          <circle cx="100" cy="52" r="2.5" fill="#FFFFFF" />
          <circle cx="122" cy="56" r="2.5" fill="#FFFFFF" />
        </g>
      );
    case "chef":
      return (
        <g>
          <circle cx="74" cy="24" r="17" fill="#FFFFFF" stroke="#E2DDD3" strokeWidth="2" />
          <circle cx="126" cy="24" r="17" fill="#FFFFFF" stroke="#E2DDD3" strokeWidth="2" />
          <circle cx="100" cy="14" r="21" fill="#FFFFFF" stroke="#E2DDD3" strokeWidth="2" />
          <path d="M66 28 L134 28 L134 56 L66 56 Z" fill="#FFFFFF" stroke="#E2DDD3" strokeWidth="2" />
        </g>
      );
    case "vaquero":
      return (
        <g>
          <path d="M66 54 C60 30 74 12 100 22 C126 12 140 30 134 54 Z" fill="#8A4B22" />
          <path d="M68 46 L132 46 L133 52 L67 52 Z" fill="#4A2812" />
          <path d="M26 58 C60 42 140 42 174 58 C150 68 50 68 26 58 Z" fill="#A0582A" />
        </g>
      );
    case "pirata":
      return (
        <g>
          <path d="M34 60 C58 28 80 22 100 24 C120 22 142 28 166 60 C140 50 60 50 34 60 Z" fill="#1E1E1E" />
          <circle cx="100" cy="38" r="7" fill="#FFFFFF" />
          <path d="M90 48 L110 54 M110 48 L90 54" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="97" cy="37" r="1.6" fill="#1E1E1E" />
          <circle cx="103" cy="37" r="1.6" fill="#1E1E1E" />
        </g>
      );
    case "mago":
      return (
        <g>
          <path d="M60 56 L108 2 L142 56 Z" fill="#2E3FA3" />
          <ellipse cx="100" cy="56" rx="50" ry="8" fill="#24318A" />
          <path d="M96 30 L99 36 L106 36 L100 40 L102 47 L96 43 L90 47 L92 40 L86 36 L93 36 Z" fill="#F2C850" />
          <circle cx="118" cy="22" r="2.5" fill="#F2C850" />
          <circle cx="80" cy="46" r="2" fill="#F2C850" />
        </g>
      );
    case "vikingo":
      return (
        <g>
          <path d="M58 52 C42 46 34 28 42 10 C46 28 56 36 66 40 Z" fill="#F4ECD8" />
          <path d="M142 52 C158 46 166 28 158 10 C154 28 144 36 134 40 Z" fill="#F4ECD8" />
          <path d="M54 62 C54 22 146 22 146 62 Z" fill="#9AA3AD" />
          <path d="M52 56 L148 56 L148 64 L52 64 Z" fill="#6E7781" />
          <path d="M96 24 L104 24 L104 60 L96 60 Z" fill="#6E7781" />
          {[64, 80, 120, 136].map((x) => (
            <circle key={x} cx={x} cy="60" r="2" fill="#C9CFD5" />
          ))}
        </g>
      );
    case "fiesta":
      return (
        <g>
          <path d="M78 48 L100 2 L122 48 Z" fill="#2FA4D9" />
          <path d="M84 36 L116 36 L113 30 L87 30 Z M91 20 L109 20 L106 14 L94 14 Z" fill="#F2C850" />
          <circle cx="100" cy="4" r="5.5" fill="#E8692B" />
        </g>
      );
    case "afro":
      return null; // se dibuja detrás (hairBack)
    case "mohicano":
      return (
        <g>
          {["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"].map((c, i) => (
            <path key={c} d={`M${74 + i * 9} 46 L${78 + i * 9} ${10 + Math.abs(2.5 - i) * 6} L${84 + i * 9} 46 Z`} fill={c} />
          ))}
        </g>
      );
    case "copete":
      return (
        <path
          d="M76 44 L80 14 L88 34 L96 6 L102 32 L112 10 L114 34 L126 18 L124 46 Z"
          fill="#E84A8A"
        />
      );
    case "tupe":
      return (
        <g>
          <path d="M58 50 C56 16 108 4 146 30 C126 24 108 28 104 44 C92 36 74 38 58 50 Z" fill="#1E1E1E" />
          <path d="M80 26 C96 16 118 16 132 24" fill="none" stroke="#555555" strokeWidth="2.5" />
        </g>
      );
    case "colita":
      return (
        <g>
          <path d="M94 38 C86 18 102 4 118 14 C108 18 106 26 108 38 Z" fill="#8A4B22" />
          <path d="M94 36 L110 36 L110 42 L94 42 Z" fill="#E84A8A" />
        </g>
      );
    case "lazo":
      return (
        <g>
          <path d="M100 40 C88 20 64 22 66 40 C68 56 88 52 100 40 Z M100 40 C112 20 136 22 134 40 C132 56 112 52 100 40 Z" fill={PINK} />
          <path d="M100 40 C92 32 78 30 76 38 M100 40 C108 32 122 30 124 38" fill="none" stroke={PINK_DARK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M96 44 L88 60 L96 56 Z M104 44 L112 60 L104 56 Z" fill={PINK_DARK} />
          <circle cx="100" cy="40" r="6.5" fill={PINK_DARK} />
        </g>
      );
    case "flores":
      return (
        <g>
          <path d="M52 66 C58 32 142 32 148 66" fill="none" stroke={LEAF} strokeWidth="4" strokeLinecap="round" />
          {[
            [55, 60, "#F48FB1"], [66, 46, WHITE], [82, 37, "#B39DDB"], [100, 34, "#F48FB1"],
            [118, 37, WHITE], [134, 46, "#B39DDB"], [145, 60, "#F48FB1"],
          ].map(([x, y, c], i) => flower(x as number, y as number, c as string, 1, i))}
        </g>
      );
    case "pelolargo":
    case "trenzas":
      return fringe();
    case "coleta":
      return (
        <g>
          {fringe()}
          <circle cx="62" cy="53" r="7" fill={PINK} />
        </g>
      );
    case "coletas":
      return (
        <g>
          {fringe()}
          <circle cx="52" cy="68" r="6.5" fill={PINK} />
          <circle cx="148" cy="68" r="6.5" fill={PINK} />
        </g>
      );
    case "mono":
      return (
        <g>
          <circle cx="100" cy="22" r="17" fill={HAIR} />
          <path d="M90 16 C94 10 104 9 110 14" fill="none" stroke={HAIR_LIGHT} strokeWidth="2.5" strokeLinecap="round" />
          {fringe()}
          <ellipse cx="100" cy="36" rx="13" ry="4.5" fill={PINK} />
        </g>
      );
    case "rizos":
      return (
        <g>
          {[[68, 50], [82, 42], [100, 39], [118, 42], [132, 50]].map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="10" fill={HAIR} />
          ))}
          {[[80, 40], [98, 37], [116, 40]].map(([cx, cy]) => (
            <path key={cx} d={`M${cx - 3} ${cy} C${cx} ${cy - 3} ${cx + 4} ${cy - 2} ${cx + 5} ${cy + 1}`} fill="none" stroke={HAIR_LIGHT} strokeWidth="2" strokeLinecap="round" />
          ))}
        </g>
      );
    case "tiara":
      return (
        <g>
          <path d="M68 48 L74 30 L86 40 L100 18 L114 40 L126 30 L132 48 C112 43 88 43 68 48 Z" fill="#E4E7EC" stroke="#A9B0BA" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="100" cy="32" r="4.5" fill={PINK} />
          <circle cx="78" cy="40" r="2.6" fill="#6EC6E8" />
          <circle cx="122" cy="40" r="2.6" fill="#6EC6E8" />
          <circle cx="98.5" cy="30.5" r="1.4" fill={WHITE} />
        </g>
      );
    case "pava":
      return (
        <g>
          <path d="M20 58 C50 40 150 40 180 58 C160 72 40 72 20 58 Z" fill="#F0DDA8" />
          <path d="M34 58 C60 48 140 48 166 58" fill="none" stroke="#D9BC7A" strokeWidth="2" />
          <path d="M66 54 C64 22 136 22 134 54 Z" fill="#E9CF94" />
          <path d="M72 36 C88 30 112 30 128 36" fill="none" stroke="#D9BC7A" strokeWidth="2" />
          <path d="M66 44 L134 44 L134 53 L66 53 Z" fill={PINK} />
          {flower(124, 46, WHITE, 1.2)}
        </g>
      );
    case "cintillo":
      return (
        <g>
          <path d="M52 70 C54 30 146 30 148 70" fill="none" stroke={PINK} strokeWidth="8" strokeLinecap="round" />
          <path d="M126 42 L114 34 L116 48 Z M126 42 L138 34 L136 48 Z" fill={PINK_DARK} />
          <circle cx="126" cy="42" r="3.5" fill={PINK_DARK} />
        </g>
      );
    case "flor":
      return (
        <g>
          <path d="M120 50 C116 40 122 32 132 34 C130 42 126 48 120 50 Z" fill={LEAF} />
          {flower(136, 46, "#E84A4A", 1.7)}
        </g>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Mano derecha (accesorio + patita encima)
// ---------------------------------------------------------------------------

function paw() {
  return (
    <g>
      <ellipse cx="143" cy="170" rx="11" ry="19" fill={FUR} />
      <circle cx="148" cy="184" r="8.5" fill={FUR_DARK} />
    </g>
  );
}

function hand(id: string) {
  let item = null;
  switch (id) {
    case "calculadora":
      item = (
        <g>
          <path d="M140 146 L174 146 L174 196 L140 196 Z" fill="#3B5B28" />
          <path d="M145 151 L169 151 L169 162 L145 162 Z" fill="#E1E797" />
          {[0, 1, 2].map((c) =>
            [0, 1, 2].map((r) => (
              <path
                key={`${c}${r}`}
                d={`M${146 + c * 8} ${167 + r * 9} h6 v6 h-6 Z`}
                fill={c === 2 && r === 2 ? "#E8692B" : "#FFFFFF"}
              />
            )),
          )}
        </g>
      );
      break;
    case "lupa":
      item = (
        <g>
          <path d="M150 186 L168 156" stroke="#6B4A2E" strokeWidth="7" strokeLinecap="round" />
          <circle cx="174" cy="142" r="17" fill="#DDF0F5" stroke="#3B5B28" strokeWidth="6" />
          <path d="M166 136 C168 132 173 130 177 131" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
      break;
    case "lapizgigante":
      item = (
        <g>
          <path d="M150 214 L136 208 L166 118 L180 124 Z" fill="#F2C850" />
          <path d="M166 118 L180 124 L178 104 Z" fill="#F4D9B0" />
          <path d="M179 110 L178 104 L175 109 Z" fill={INK} />
          <path d="M150 214 L136 208 L133 216 L147 222 Z" fill="#E88B9A" />
        </g>
      );
      break;
    case "cafe":
      item = (
        <g>
          <path d="M142 160 L172 160 L168 196 L146 196 Z" fill="#FFFFFF" stroke="#6B4A2E" strokeWidth="3" />
          <path d="M142 160 L172 160 L171 168 L143 168 Z" fill="#8A4B22" />
          <path d="M172 168 C184 168 184 184 170 184" fill="none" stroke="#6B4A2E" strokeWidth="3" />
          <path d="M152 152 C148 146 156 142 152 136 M162 152 C158 146 166 142 162 136" fill="none" stroke="#C9C2B4" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
      break;
    case "maletin":
      item = (
        <g>
          <path d="M150 188 C150 178 166 178 166 188" fill="none" stroke="#4A2812" strokeWidth="4" />
          <path d="M136 188 L182 188 L182 222 L136 222 Z" fill="#8A4B22" />
          <path d="M136 200 L182 200" stroke="#4A2812" strokeWidth="3" />
          <path d="M155 197 L163 197 L163 204 L155 204 Z" fill={GOLD} />
        </g>
      );
      break;
    case "sello":
      item = (
        <g>
          <path d="M152 146 L168 146 L168 168 L152 168 Z" fill="#6B4A2E" />
          <ellipse cx="160" cy="146" rx="10" ry="5" fill="#8A6A4E" />
          <path d="M144 168 L176 168 L176 180 L144 180 Z" fill="#C0392B" />
          <circle cx="160" cy="200" r="11" fill="none" stroke="#C0392B" strokeWidth="2.5" />
          <path d="M154 200 L158 204 L166 195" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
      break;
    case "monedas":
      item = (
        <g>
          <path d="M146 176 C136 196 142 220 162 220 C182 220 188 196 178 176 Z" fill="#C9A66B" />
          <path d="M150 176 L174 176 L170 168 L154 168 Z" fill="#A9864B" />
          <path d="M166 186 C164 183 157 183 157 188 C157 193 167 191 167 197 C167 202 159 202 157 199 M162 181 L162 205" fill="none" stroke="#6B4A2E" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="140" cy="212" r="7" fill={GOLD} stroke={GOLD_DARK} strokeWidth="2" />
        </g>
      );
      break;
    case "laptop":
      item = (
        <g>
          <path d="M138 146 L182 140 L182 176 L138 182 Z" fill="#5A6470" />
          <path d="M142 150 L178 145 L178 172 L142 177 Z" fill="#9AD0E8" />
          <path d="M132 182 L184 176 L188 182 L136 190 Z" fill="#3D454F" />
        </g>
      );
      break;
    case "bellota":
      item = (
        <g>
          <path d="M146 168 C146 200 174 200 174 168 Z" fill="#C98A4B" />
          <path d="M142 168 C142 154 178 154 178 168 Z" fill="#6B4A2E" />
          <path d="M160 154 L162 146" stroke="#6B4A2E" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
      break;
    case "bolso":
      item = (
        <g>
          <path d="M146 186 C146 164 174 164 174 186" fill="none" stroke={PINK_DARK} strokeWidth="4" />
          <path d="M136 184 L184 184 L180 216 L140 216 Z" fill={PINK} />
          <path d="M136 184 L184 184 L174 200 L146 200 Z" fill={PINK_DARK} />
          <circle cx="160" cy="199" r="3.5" fill={GOLD} />
        </g>
      );
      break;
    case "agenda":
      item = (
        <g>
          <path d="M140 150 L176 150 L176 198 L140 198 Z" fill="#6B3FA0" />
          <path d="M176 152 L180 154 L180 200 L176 198 Z" fill={WHITE} />
          <path d="M146 160 L166 160 L166 172 L146 172 Z" fill={WHITE} fillOpacity="0.9" />
          <path d="M170 150 L170 198" stroke="#F2C850" strokeWidth="3" />
          <path d="M150 198 L150 210 L154 206 L158 210 L158 198 Z" fill={PINK} />
        </g>
      );
      break;
    case "ramo":
      item = (
        <g>
          <path d="M152 186 L156 154 M160 186 L168 148 M166 186 L180 158" stroke={LEAF} strokeWidth="3" strokeLinecap="round" />
          {flower(154, 152, "#F48FB1", 1.3)}
          {flower(170, 144, WHITE, 1.3)}
          {flower(182, 158, "#B39DDB", 1.3)}
          {flower(166, 162, "#E84A4A", 1.1)}
          <path d="M140 172 L186 166 L166 216 Z" fill="#F7E6EE" stroke={PINK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M164 192 L154 186 L156 198 Z M164 192 L174 186 L172 198 Z" fill={PINK} />
        </g>
      );
      break;
    case "abanico": {
      const cx = 152;
      const cy = 184;
      const R = 38;
      const pt = (deg: number, rad: number) => {
        const a = (deg * Math.PI) / 180;
        return `${r1(cx + Math.cos(a) * rad)} ${r1(cy + Math.sin(a) * rad)}`;
      };
      const ribs = [-130, -106, -82, -58, -34, -10];
      item = (
        <g>
          <path d={`M${cx} ${cy} L${pt(-130, R)} A${R} ${R} 0 0 1 ${pt(-10, R)} Z`} fill={PINK} />
          <path d={`M${pt(-130, R - 6)} A${R - 6} ${R - 6} 0 0 1 ${pt(-10, R - 6)}`} fill="none" stroke={WHITE} strokeWidth="2" strokeDasharray="3 3" />
          {ribs.map((d) => (
            <path key={d} d={`M${cx} ${cy} L${pt(d, R)}`} stroke={PINK_DARK} strokeWidth="1.8" />
          ))}
          <circle cx={cx} cy={cy} r="3.5" fill={GOLD} />
        </g>
      );
      break;
    }
    case "espejo":
      item = (
        <g>
          <path d="M150 192 L160 166" stroke={PINK_DARK} strokeWidth="7" strokeLinecap="round" />
          <circle cx="166" cy="150" r="17" fill={PINK} />
          <circle cx="166" cy="150" r="12" fill="#DDF0F5" />
          <path d="M159 146 C160 142 163 140 167 140" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
      break;
    default:
      item = null;
  }
  return (
    <g>
      {item}
      {paw()}
    </g>
  );
}
