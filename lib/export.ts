/** Spreadsheet helpers (CSV with UTF-8 BOM and ";" separator, plus XLSX via exceljs). */
import { getDayNumber, formatDateTimeBogota, formatDuration } from "@/lib/time";

export interface Sheet {
  name: string;
  columns: string[];
  rows: (string | number)[][];
}

const STATUS_LABEL: Record<string, string> = { won: "Ganó", lost: "Perdió", playing: "En curso" };
const REASON_LABEL: Record<string, string> = { errors: "Vidas", timeout: "Tiempo" };

export function statusLabel(s: string): string {
  return STATUS_LABEL[s] ?? s;
}
export function reasonLabel(r: string | null): string {
  return r ? (REASON_LABEL[r] ?? r) : "";
}

export interface ParticipantLike {
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  last_seen_at: string;
  days_played: number;
  days_won: number;
  phone_dup_count: number;
}

export interface ResultLike {
  game_date: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  lost_reason: string | null;
  wrong_count: number;
  guessed_letters: string[];
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  win_code: string | null;
}

export function participantsSheet(rows: ParticipantLike[]): Sheet {
  return {
    name: "Inscritos",
    columns: [
      "Nombre",
      "Correo",
      "Celular",
      "Fecha de registro",
      "Último ingreso",
      "Días jugados",
      "Días ganados",
      "Celular repetido",
    ],
    rows: rows.map((r) => [
      r.full_name,
      r.email,
      r.phone,
      formatDateTimeBogota(r.created_at),
      formatDateTimeBogota(r.last_seen_at),
      Number(r.days_played),
      Number(r.days_won),
      Number(r.phone_dup_count) > 1 ? `Sí (${r.phone_dup_count} correos)` : "No",
    ]),
  };
}

/** Label for the "Ganador del día" column (computed by the caller with the winner rules). */
export type WinnerLabel = (row: ResultLike) => string;

export function resultsSheet(
  rows: ResultLike[],
  name = "Resultados",
  winnerLabel: WinnerLabel = () => "",
): Sheet {
  return {
    name,
    columns: [
      "Día",
      "Fecha",
      "Nombre",
      "Correo",
      "Celular",
      "Estado",
      "Motivo de derrota",
      "Vidas usadas",
      "Letras usadas",
      "Hora de inicio (Colombia)",
      "Hora de fin (Colombia)",
      "Duración",
      "Código de ganador",
      "Ganador del día",
    ],
    rows: rows.map((r) => [
      getDayNumber(r.game_date) ?? "",
      r.game_date,
      r.full_name,
      r.email,
      r.phone,
      statusLabel(r.status),
      reasonLabel(r.lost_reason),
      r.wrong_count,
      r.guessed_letters.join(" "),
      formatDateTimeBogota(r.started_at),
      formatDateTimeBogota(r.finished_at),
      formatDuration(r.duration_ms),
      r.win_code ?? "",
      winnerLabel(r),
    ]),
  };
}

function csvCell(value: string | number): string {
  let s = String(value);
  // Prevent CSV/formula injection when opened in Excel (plain numbers like "+57300..." are safe).
  if (/^[=@\t\r]/.test(s) || (/^[+\-]/.test(s) && !/^[+\-]?\d+$/.test(s))) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(sheet: Sheet): string {
  const lines = [sheet.columns, ...sheet.rows].map((row) => row.map(csvCell).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}

export async function toXlsx(sheets: Sheet[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ahorcadito Diario 11Diez";
  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name.slice(0, 31));
    ws.addRow(sheet.columns).font = { bold: true };
    // Phone numbers like "+57..." must stay text, never formulas.
    for (const row of sheet.rows) ws.addRow(row);
    ws.columns.forEach((col) => {
      let max = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        max = Math.max(max, String(cell.value ?? "").length + 2);
      });
      col.width = Math.min(max, 50);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}
