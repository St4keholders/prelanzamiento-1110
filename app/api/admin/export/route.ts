import { getAllParticipants, getAllResults, getBonusResults } from "@/lib/admin";
import {
  type ResultLike,
  type Sheet,
  participantsSheet,
  resultsSheet,
  toCsv,
  toXlsx,
} from "@/lib/export";
import { jsonError } from "@/lib/http";
import { isAdmin } from "@/lib/session";
import { allGameDates, getDayNumber, isGameDate } from "@/lib/time";
import { describeTitle, titleStatus } from "@/lib/winner-rules";
import { byEmail, getOfficialWinners } from "@/lib/winners";

async function winnerLabeler() {
  const winners = byEmail(await getOfficialWinners());
  return (r: ResultLike) => {
    const s = titleStatus(r.email, r.game_date, r.status === "won", winners);
    if (s.kind === "multi") return "Sí (Día 1: todos ganan)";
    if (s.kind === "winner") return "Sí";
    if (s.kind === "already") return `No (ya ganó ${describeTitle(s.titleDate)})`;
    return "";
  };
}

/**
 * GET /api/admin/export?type=participants|results|all-results&format=xlsx|csv&date=YYYY-MM-DD
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return jsonError("unauthorized", "No autorizado.", 401);

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const date = url.searchParams.get("date") ?? "";

  let sheets: Sheet[];
  let filename: string;

  try {
    if (type === "participants") {
      sheets = [participantsSheet(await getAllParticipants())];
      filename = "inscritos";
    } else if (type === "results") {
      if (!isGameDate(date)) return jsonError("invalid", "Fecha no válida.", 400);
      const [rows, label] = await Promise.all([getAllResults(date), winnerLabeler()]);
      sheets = [resultsSheet(rows, `Día ${getDayNumber(date)}`, label)];
      filename = `resultados-${date}`;
    } else if (type === "all-results") {
      const [all, label, bonus] = await Promise.all([
        getAllResults(),
        winnerLabeler(),
        getBonusResults(),
      ]);
      if (format === "xlsx") {
        sheets = [
          resultsSheet(all, "Todos", label),
          ...allGameDates().map((d) =>
            resultsSheet(
              all.filter((r) => r.game_date === d),
              `Día ${getDayNumber(d)}`,
              label,
            ),
          ),
          ...(bonus.length > 0 ? [resultsSheet(bonus, "Ronda bonus", label)] : []),
        ];
      } else {
        sheets = [resultsSheet(all, "Todos", label)];
      }
      filename = "resultados-todos";
    } else {
      return jsonError("invalid", "Tipo de exportación no válido.", 400);
    }
  } catch (err) {
    console.error(err);
    return jsonError("internal", "No se pudo generar el archivo.", 500);
  }

  if (format === "csv") {
    return new Response(toCsv(sheets[0]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await toXlsx(sheets);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
