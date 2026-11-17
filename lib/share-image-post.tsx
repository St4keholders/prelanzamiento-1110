import "server-only";
import { ImageResponse } from "next/og";
import { Flag } from "@/components/teams/Art";
import { SquirrelFigure } from "@/components/teams/SquirrelFigure";
import { formatMs } from "@/lib/event-format";
import { SHARE_HEIGHT, SHARE_WIDTH, loadAssets } from "@/lib/share-image";
import type { MyRanking, PublicTeam } from "@/lib/team-types";
import { colorHex } from "@/lib/teams-catalog";
import { TOTAL_DAYS } from "@/lib/time";

const BG = "#2B5932";
const CREAM = "#F8F4EB";
const YELLOW = "#F2C850";
const DARK = "#1F3D24";

const DOT: Record<string, { bg: string; border: string }> = {
  won: { bg: YELLOW, border: YELLOW },
  lost: { bg: "#D5717B", border: "#D5717B" },
  missed: { bg: "rgba(248,244,235,0.22)", border: "rgba(248,244,235,0.22)" },
};

function Pill({ text, bg = YELLOW, color = DARK }: { text: string; bg?: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        backgroundColor: bg,
        color,
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: 1,
        padding: "10px 28px",
        borderRadius: 999,
      }}
    >
      {text}
    </div>
  );
}

/** "Quedé #37 de 397" story image for the ranking. */
export async function renderRankingImage(me: MyRanking): Promise<ImageResponse> {
  const assets = await loadAssets();
  const stats: [string, string][] = [
    ["PALABRAS", `${me.won}/${TOTAL_DAYS}`],
    ["TIEMPO TOTAL", formatMs(me.totalMs)],
    ["MEJOR TIEMPO", formatMs(me.bestMs)],
    ["RACHA", `${me.longestStreak} ${me.longestStreak === 1 ? "día" : "días"}`],
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: BG,
          padding: "0 100px 120px",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assets.happy} width={170} height={170} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: CREAM }}>@11diez</div>
            <Pill text="RANKING · AHORCADITO 1110" />
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 70, fontSize: 64, fontWeight: 700, color: CREAM }}>
          Quedé en el puesto
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 260, lineHeight: 1, fontWeight: 800, color: YELLOW, letterSpacing: -8 }}>
            #{me.position}
          </div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: CREAM, marginBottom: 34 }}>
            de {me.totalPlayers}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 50,
            backgroundColor: CREAM,
            borderRadius: 48,
            padding: "40px 44px",
            gap: 28,
          }}
        >
          {stats.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", width: 380 }}>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 2, color: BG }}>{k}</div>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: DARK }}>{v}</div>
            </div>
          ))}
          <div style={{ display: "flex", width: "100%", fontSize: 34, fontWeight: 700, color: "#3B5B28" }}>
            {me.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 70, gap: 22 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: CREAM }}>
            {`Adiviné ${me.won} de ${TOTAL_DAYS} palabras`}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {me.days.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 62,
                  height: 62,
                  borderRadius: 999,
                  backgroundColor: DOT[d].bg,
                  border: `4px solid ${DOT[d].border}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { width: SHARE_WIDTH, height: SHARE_HEIGHT, fonts: assets.fonts, headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Team card: flag, name, table, motto and the squirrels of the members (+ empty seats). */
export async function renderTeamCard(team: PublicTeam, eventLine: string): Promise<ImageResponse> {
  const assets = await loadAssets();
  const color = colorHex(team.color);
  const seats = Array.from({ length: team.seatsTotal }, (_, i) => team.members[i] ?? null);
  const longName = team.name.length > 16;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: color,
          padding: "0 90px 80px",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Pill text={`MESA ${team.tableNumber}`} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: CREAM }}>@11diez</div>
        </div>

        <div style={{ display: "flex", marginTop: 50, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: CREAM,
              borderRadius: 60,
              padding: "36px 46px",
            }}
          >
            <Flag kind={team.flag} color={color} size={360} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 50,
            justifyContent: "center",
            textAlign: "center",
            fontSize: longName ? 96 : 120,
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: -2,
            color: CREAM,
          }}
        >
          {team.name}
        </div>
        {team.motto && (
          <div
            style={{
              display: "flex",
              marginTop: 18,
              justifyContent: "center",
              textAlign: "center",
              fontSize: 40,
              fontWeight: 600,
              color: CREAM,
              opacity: 0.92,
            }}
          >
            {`“${team.motto}”`}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 56,
            backgroundColor: CREAM,
            borderRadius: 48,
            padding: "34px 20px",
            gap: 18,
          }}
        >
          {seats.map((m, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 270 }}
            >
              {m ? (
                <SquirrelFigure look={m.squirrel} color={color} size={180} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: 170,
                    height: 170,
                    margin: "22px 5px 26px",
                    borderRadius: 999,
                    border: `6px dashed ${color}`,
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 90,
                    fontWeight: 800,
                    color,
                  }}
                >
                  ?
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  marginTop: 6,
                  fontSize: 30,
                  fontWeight: 800,
                  color: m ? DARK : color,
                  textAlign: "center",
                }}
              >
                {m ? m.name.split(" ")[0] : "¿Te sumas?"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40, fontSize: 32, fontWeight: 700, color: CREAM }}>
          {eventLine}
        </div>
      </div>
    ),
    { width: SHARE_WIDTH, height: SHARE_HEIGHT, fonts: assets.fonts, headers: { "Cache-Control": "private, no-store" } },
  );
}
