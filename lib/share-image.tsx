import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { DayResult } from "@/lib/game-types";
import {
  type ShareVariant,
  dayPillText,
  winnerBadge,
  livesLeftText,
  lostLivesText,
  progressText,
  revengeText,
  shareTitle,
} from "@/lib/share-text";
import { formatDuration } from "@/lib/time";

export const SHARE_WIDTH = 1080; // Instagram story 9:16
export const SHARE_HEIGHT = 1920;

export interface ShareImageData {
  variant: ShareVariant;
  /** Día 1: everyone who guesses wins (+25 nueces bonus). */
  multiWinnerDay: boolean;
  fullName: string;
  dayNumber: number;
  date: string;
  durationMs: number | null;
  livesLeft: number;
  maxLives: number;
  isLastDay: boolean;
  wonCount: number;
  days: DayResult[];
  /** Bonus round: replaces the "DÍA X DE 11" pill, the title and the winner badge. */
  bonus?: { pill: string; title: string; badge: string };
}

// ---------------------------------------------------------------------------
// Assets (read once per server instance; files live in /assets/share)
// ---------------------------------------------------------------------------

const ASSET_DIR = join(process.cwd(), "assets", "share");

let assetsPromise: Promise<{
  fonts: { name: string; data: Buffer; weight: 600 | 700 | 800; style: "normal" }[];
  happy: string;
  sad: string;
}> | null = null;

function loadAssets() {
  assetsPromise ??= (async () => {
    const [semibold, bold, extrabold, happy, sad] = await Promise.all([
      readFile(join(ASSET_DIR, "Manrope_600SemiBold.ttf")),
      readFile(join(ASSET_DIR, "Manrope_700Bold.ttf")),
      readFile(join(ASSET_DIR, "Manrope_800ExtraBold.ttf")),
      readFile(join(ASSET_DIR, "mascot-avatar-happy.png"), "base64"),
      readFile(join(ASSET_DIR, "mascot-avatar-sad.png"), "base64"),
    ]);
    return {
      fonts: [
        { name: "Manrope", data: semibold, weight: 600 as const, style: "normal" as const },
        { name: "Manrope", data: bold, weight: 700 as const, style: "normal" as const },
        { name: "Manrope", data: extrabold, weight: 800 as const, style: "normal" as const },
      ],
      happy: `data:image/png;base64,${happy}`,
      sad: `data:image/png;base64,${sad}`,
    };
  })();
  return assetsPromise;
}

// ---------------------------------------------------------------------------
// Theme (colors sampled from the 11diez designs)
// ---------------------------------------------------------------------------

const GREEN = {
  bg: "#2B5932",
  title: "#F8F4EB",
  pillBg: "#F2C850",
  pillText: "#1F3D24",
  card: "#F8F4EB",
  cardLabel: "#2B5932",
  cardBig: "#1F3D24",
  cardText: "#2C2C2C",
  cardName: "#3B5B28",
  divider: "#DDD6C6",
  heartFull: "#C41E3A",
  heartEmpty: "#B8C4AE",
  progress: "#F8F4EB",
  dot: {
    won: { bg: "#F2C850", border: "#F2C850" },
    lost: { bg: "#D5717B", border: "#D5717B" },
    playing: { bg: "#D5717B", border: "#D5717B" },
    missed: { bg: "rgba(248,244,235,0.22)", border: "rgba(248,244,235,0.22)" },
    future: { bg: "transparent", border: "rgba(248,244,235,0.6)" },
  },
};

const CREAM = {
  bg: "#F4EDDA",
  title: "#1F2A1C",
  pillBg: "#2C5439",
  pillText: "#FFFFFF",
  card: "#FFFFFF",
  cardLabel: "#2C5439",
  cardBig: "#1F2A1C",
  cardText: "#2C2C2C",
  cardName: "#42513A",
  divider: "#E7E1D2",
  heartFull: "#C41E3A",
  heartEmpty: "#C8C4B9",
  progress: "#1F2A1C",
  dot: {
    won: { bg: "#2C5439", border: "#2C5439" },
    lost: { bg: "#B13A34", border: "#B13A34" },
    playing: { bg: "#B13A34", border: "#B13A34" },
    missed: { bg: "#DCD5C3", border: "#DCD5C3" },
    future: { bg: "transparent", border: "#B9B2A3" },
  },
};

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function Hearts({ left, max, full, empty }: { left: number; max: number; full: string; empty: string }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width={62} height={62} viewBox="0 0 24 24">
          <path d={HEART_PATH} fill={i < left ? full : empty} />
        </svg>
      ))}
    </div>
  );
}

export async function renderShareImage(data: ShareImageData): Promise<ImageResponse> {
  const assets = await loadAssets();
  const won = data.variant === "winner" || data.variant === "won";
  const isWinner = data.variant === "winner";
  const t = won ? GREEN : CREAM;
  const title =
    data.bonus && data.variant === "winner"
      ? data.bonus.title
      : shareTitle(data.variant, data.multiWinnerDay, data.dayNumber);
  const titleSize = title.length <= 10 ? 140 : title.length <= 14 ? 120 : 112;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: t.bg,
          padding: "0 100px 140px",
          fontFamily: "Manrope",
        }}
      >
        {/* Encabezado: mascota + @11diez + día */}
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={won ? assets.happy : assets.sad} width={170} height={170} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: t.title }}>
              @11diez
            </div>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                backgroundColor: t.pillBg,
                color: t.pillText,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 1,
                padding: "10px 28px",
                borderRadius: 999,
              }}
            >
              {data.bonus?.pill ?? dayPillText(data.dayNumber, data.date)}
            </div>
          </div>
        </div>

        {isWinner && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 64, gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                border: `4px solid ${GREEN.pillBg}`,
                color: GREEN.pillBg,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 3,
                padding: "12px 30px",
                borderRadius: 999,
              }}
            >
              {data.bonus?.badge ?? winnerBadge(data.multiWinnerDay)}
            </div>
            {data.multiWinnerDay && !data.bonus && (
              <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: GREEN.title }}>
                La app 1110 sale el 11 de noviembre
              </div>
            )}
          </div>
        )}

        {/* Título */}
        <div
          style={{
            display: "flex",
            marginTop: isWinner ? 36 : 70,
            fontSize: titleSize,
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: -3,
            color: t.title,
          }}
        >
          {title}
        </div>

        {/* Tarjeta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 60,
            backgroundColor: t.card,
            borderRadius: 48,
            padding: "52px 56px",
          }}
        >
          {won ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: t.cardLabel,
                }}
              >
                MI TIEMPO DE HOY
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  fontSize: 132,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: -2,
                  color: t.cardBig,
                }}
              >
                {formatDuration(data.durationMs)}
              </div>
              <div style={{ display: "flex", height: 3, backgroundColor: t.divider, margin: "36px 0" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: t.cardText }}>
                  {livesLeftText(data.livesLeft)}
                </div>
                <Hearts
                  left={data.livesLeft}
                  max={data.maxLives}
                  full={t.heartFull}
                  empty={t.heartEmpty}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: data.variant === "lost-errors" ? 64 : 48,
                    fontWeight: 800,
                    color: t.cardBig,
                  }}
                >
                  {lostLivesText(data.variant, data.livesLeft)}
                </div>
                <Hearts
                  left={data.livesLeft}
                  max={data.maxLives}
                  full={t.heartFull}
                  empty={t.heartEmpty}
                />
              </div>
              <div style={{ display: "flex", height: 3, backgroundColor: t.divider, margin: "36px 0" }} />
              <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: t.cardText }}>
                {revengeText(data.isLastDay)}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 34,
              fontWeight: 700,
              color: t.cardName,
            }}
          >
            {data.fullName}
          </div>
        </div>

        {/* Racha de 11 días */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 90, gap: 22 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: t.progress }}>
            {progressText(data.wonCount)}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {data.days.map((result, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 62,
                  height: 62,
                  borderRadius: 999,
                  backgroundColor: t.dot[result].bg,
                  border: `4px solid ${t.dot[result].border}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: SHARE_WIDTH,
      height: SHARE_HEIGHT,
      fonts: assets.fonts,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
