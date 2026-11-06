import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { WordEditor } from "@/components/WordEditor";
import { getDailyWords } from "@/lib/admin";
import { serverNow } from "@/lib/env";
import { isAdmin } from "@/lib/session";
import {
  allGameDates,
  formatEditDeadline,
  formatLongDate,
  getDayNumber,
  isWordEditable,
  TIME_LIMIT_SECONDS,
} from "@/lib/time";

async function WordsContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  const words = await getDailyWords();
  const byDate = new Map(words.map((w) => [w.game_date, w]));
  const now = serverNow();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark">Palabras del reto</h1>
          <p className="text-sm text-muted">
            La palabra, la categoría y el tiempo de cada día se pueden cambiar hasta las 11:59 p. m.
            del día anterior (hora Colombia). Cuando su día empieza, quedan bloqueados. Tiempo por
            defecto: 1:30.
          </p>
        </div>

        <div className="space-y-3">
          {allGameDates().map((date) => {
            const row = byDate.get(date);
            return (
              <WordEditor
                key={date}
                date={date}
                dayNumber={getDayNumber(date) ?? 0}
                longDate={formatLongDate(date)}
                initialWord={row?.word ?? ""}
                initialCategory={row?.category ?? ""}
                initialTime={row?.time_limit_seconds ?? TIME_LIMIT_SECONDS}
                editable={isWordEditable(date, now)}
                deadlineLabel={formatEditDeadline(date)}
              />
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

export default function AdminWordsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Cargando palabras…</div>}>
      <WordsContent />
    </Suspense>
  );
}
