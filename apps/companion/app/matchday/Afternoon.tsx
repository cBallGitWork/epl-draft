import {
  type FootballPlayer,
  type FootballSnapshot,
  fixturesInOrder,
} from "@epl/core";
import { londonDayAndTime } from "../londonTime";
import { LABEL, PANEL } from "@/app/desk";

// Your afternoon: who of yours is still to come, and when.
//
// The question the live view could not answer. A manager on 47 points with two
// hours of football left wants to know which two hours — and the score above
// says nothing about it, while the fixture list below says it ten fixtures at a
// time. This is the same fact read in the order the football happens.
//
// **The day is printed, not just the hour**, and "afternoon" is the name rather
// than the scope. A round is not an afternoon: GW1 ran Friday night to Monday
// night, and the strip listed `15:00` above `14:00` — correct, because one was
// Saturday and the other Sunday, and unreadable, because it said neither.
// `londonDayAndTime` exists for exactly this ("anything far enough away that the
// hour alone is ambiguous"), and it is used unconditionally: every Premier
// League round spans at least two days, so a conditional day would be a branch
// that is almost never taken and wrong the week it is.
//
// Your ACTIVE players only. Reserves do not score, so a reserve in the 17:30 is
// not part of your afternoon — and your own lineup is never withheld from you,
// so reading it here withholds nothing from anybody else.

export default function Afternoon({
  snapshot,
  players,
}: {
  snapshot: FootballSnapshot;
  /** Your active players per fixture. Absent when signed out or undrafted, and
   *  then this renders nothing at all rather than an empty panel. */
  players: Map<number, FootballPlayer[]> | undefined;
}) {
  if (players === undefined) return null;

  // Grouped by kickoff, in kickoff order. A finished match is not part of the
  // afternoon still ahead — it is a result, and the fixture list has it.
  const groups = new Map<string, { minutes: number | null; names: string[] }>();
  for (const fixture of fixturesInOrder(snapshot)) {
    const yours = players.get(fixture.id);
    if (yours === undefined || fixture.status === "finished") continue;

    const key = fixture.kickoff ?? "";
    const group = groups.get(key) ?? { minutes: null, names: [] };
    group.names.push(...yours.map((p) => p.name));
    // Simultaneous kickoffs run to the same clock. The strip is a glance, not a
    // stopwatch, so the group carries one minute rather than a row per match.
    if (fixture.status === "live") {
      group.minutes = Math.max(group.minutes ?? 0, fixture.minutes);
    }
    groups.set(key, group);
  }

  if (groups.size === 0) return null;

  return (
    <section className={PANEL}>
      <h2 className={LABEL}>Your afternoon</h2>
      <ul className="flex flex-col gap-1">
        {[...groups].map(([kickoff, group]) => (
          <li key={kickoff} className="flex items-baseline gap-2 text-sm">
            <span className="numeric w-20 shrink-0 font-semibold">
              {group.minutes === null ? (
                // TBC rather than a borrowed time: a TV pick with no slot yet is
                // still part of the round, and it must not wear a neighbour's.
                kickoff === "" ? (
                  "TBC"
                ) : (
                  londonDayAndTime(kickoff)
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-live">
                  <span className="live-dot" />
                  {group.minutes}′
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted">
              {group.names.sort((a, b) => a.localeCompare(b)).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
