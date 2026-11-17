import { Flag } from "@/components/teams/Art";
import { SquirrelFigure } from "@/components/teams/SquirrelFigure";
import type { PublicTeam } from "@/lib/team-types";
import { colorHex } from "@/lib/teams-catalog";

/** Team header + members (squirrels) + empty seats. Server- and client-safe. */
export function TeamPreview({ team }: { team: PublicTeam }) {
  const color = colorHex(team.color);
  const empty = Math.max(0, team.seatsTotal - team.members.length - team.invites.length);
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <div className="flex items-center gap-3 p-4" style={{ backgroundColor: color }}>
        <div className="rounded-2xl bg-white/95 p-1.5">
          <Flag kind={team.flag} color={color} size={72} />
        </div>
        <div className="min-w-0 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
            Mesa {team.tableNumber} ·{" "}
            {team.confirmed ? "✅ Confirmada" : `${team.members.length} de ${team.seatsTotal} confirmados`}
          </p>
          <h2 className="font-display text-xl font-extrabold leading-tight">{team.name}</h2>
          {team.motto && <p className="text-xs font-semibold opacity-95">“{team.motto}”</p>}
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2 p-3">
        {team.members.map((m) => (
          <li key={m.participantId} className="flex flex-col items-center text-center">
            <SquirrelFigure look={m.squirrel} color={color} size={74} />
            <span className="w-full truncate text-xs font-bold text-ink">
              {m.name.split(" ")[0]}
              {m.isMe ? " (tú)" : ""}
            </span>
            {m.isCaptain && <span className="text-[10px] font-extrabold text-cta">CAPITÁN</span>}
          </li>
        ))}
        {team.invites.map((i) => (
          <li key={i.id} className="flex flex-col items-center text-center opacity-60">
            <span className="flex h-20 w-16 items-center justify-center rounded-full border-2 border-dashed border-line text-xl">
              ⏳
            </span>
            <span className="w-full truncate text-xs font-bold text-ink">{i.name.split(" ")[0]}</span>
            <span className="text-[10px] font-bold text-muted">INVITADO</span>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`e${i}`} className="flex flex-col items-center text-center">
            <span
              className="flex h-20 w-16 items-center justify-center rounded-full border-2 border-dashed text-xl font-extrabold"
              style={{ borderColor: color, color }}
            >
              ?
            </span>
            <span className="text-xs font-bold text-muted">Libre</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
