import { getAllParticipants, getAllResults } from "@/lib/admin";
import { participantsSheet, resultsSheet, toCsv, toXlsx, type Sheet } from "@/lib/export";
import { jsonError } from "@/lib/http";
import { isAdmin } from "@/lib/session";
import { allGameDates, getDayNumber, isGameDate } from "@/lib/time";

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
      sheets = [resultsSheet(await getAllResults(date), `Día ${getDayNumber(date)}`)];
      filename = `resultados-${date}`;
    } else if (type === "all-results") {
      const all = await getAllResults();
      if (format === "xlsx") {
        sheets = [
          resultsSheet(all, "Todos"),
          ...allGameDates().map((d) =>
            resultsSheet(
              all.filter((r) => r.game_date === d),
              `Día ${getDayNumber(d)}`,
            ),
          ),
        ];
      } else {
        sheets = [resultsSheet(all, "Todos")];
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
