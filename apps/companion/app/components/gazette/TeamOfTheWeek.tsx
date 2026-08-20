import { NOTABLE_SAVES, type Pick, type TeamOfTheWeek as Eleven } from "@epl/core";
import Section from "../shell/Section";
import { yoursBorder } from "../../mine";

// The best eleven anyone owned this week, and who owns them.
//
// The joke the league tells is not "Haaland scored twice" — everyone saw that.
// It is whose Haaland he was, and which manager left him out.

/** What got him picked, in the fewest words that are still true. */
function did(pick: Pick): string {
  const notes = [
    pick.goals > 0 ? `${pick.goals}G` : null,
    pick.assists > 0 ? `${pick.assists}A` : null,
    pick.cleanSheet ? "CS" : null,
    pick.saves >= NOTABLE_SAVES ? `${pick.saves} saves` : null,
  ].filter((note): note is string => note !== null);
  return notes.length > 0 ? notes.join(" · ") : `${pick.minutes}'`;
}

export default function TeamOfTheWeek({ eleven, mine }: { eleven: Eleven; mine: string | null }) {
  return (
    <Section title="Team of the week" aside={eleven.shape}>
      <ul className="flex flex-col gap-1.5">
        {eleven.picks.map((pick) => (
          <li
            key={pick.playerCode}
            className={`elev rounded-xl border bg-surface px-3 py-2.5 ${yoursBorder(
              pick.ownerTeamId === mine,
            )}`}
          >
            <p className="flex items-baseline gap-2">
              <span className="numeric w-5 shrink-0 text-2xs text-faint">{pick.position}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{pick.playerName}</span>
              <span className="numeric shrink-0 text-2xs text-muted">{did(pick)}</span>
            </p>
            <p className="pl-7 pt-0.5 text-2xs text-faint">
              {pick.ownerName}
              {/* The best story on the page: his own manager left him out. */}
              {pick.started ? null : (
                <span className="font-semibold text-mid"> · left him on the bench</span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
