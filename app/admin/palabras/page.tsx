import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { WordEditor } from "@/components/WordEditor";
import { getDailyWords } from "@/lib/admin";
import { serverNow } from "@/lib/env";
import { isAdmin } from "@/lib/session";
import { formatStart, isStartEditable, toHHMM, windowFor } from "@/lib/schedule";
import { getSchedule } from "@/lib/schedule-server";
import { TIME_LIMIT_SECONDS, allGameDates, formatLongDate, getDayNumber } from "@/lib/time";

async function WordsContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [words, schedule] = await Promise.all([getDailyWords(), getSchedule()]);
  const byDate = new Map(words.map((w) => [w.game_date, w]));
  const now = serverNow();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark">Palabras del reto</h1>
          <p className="text-sm text-muted">
            Cada palabra se juega desde su hora de inicio hasta que sale la siguiente (la última, 24
            horas). La palabra, la categoría, el tiempo y la hora de inicio se pueden cambiar hasta
            que la palabra sale (hora Colombia). Tiempo por defecto: 1:30.
          </p>
        </div>

        <div className="space-y-3">
          {allGameDates().map((date) => {
            const row = byDate.get(date);
            const win = windowFor(schedule, date);
            const startsAt = win?.startsAt ?? new Date(`${date}T00:00:00-05:00`);
            const editable = isStartEditable(startsAt, now);
            return (
              <WordEditor
                key={date}
                date={date}
                dayNumber={getDayNumber(date) ?? 0}
                longDate={formatLongDate(date)}
                initialWord={row?.word ?? ""}
                initialCategory={row?.category ?? ""}
                initialTime={row?.time_limit_seconds ?? TIME_LIMIT_SECONDS}
                initialStartTime={toHHMM(startsAt)}
                editable={editable}
                deadlineLabel={`hasta que salga (${formatStart(startsAt)})`}
                windowLabel={win ? `${formatStart(win.startsAt)} → ${formatStart(win.endsAt)}` : ""}
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
