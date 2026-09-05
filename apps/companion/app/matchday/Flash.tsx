import type { Club, Fixture, MatchEvent } from "@epl/core";
import type { WireLine } from "./wireLines";
import { SMALL_CAPS } from "@/app/desk";

// The thing that just happened, said once and said loudly.
//
// Two heritages meeting on one object. Championship Manager draws a full-width
// plate for the event of the moment — `cm0102/02.jpg`'s yellow `Yellow Card !`
// across the middle of the match screen — and Soccer Saturday's vidiprinter
// announces a goal the instant it lands. Same plate, same job.
//
// **The switch is OWNERSHIP, and that is the whole design.** A line naming one
// of your men takes the accent fill; anybody else's takes the grey bevel. CM's
// plate is yellow and our yellow means "yours", so the reference's most
// recognisable in-match object and DESIGN §3's most rigid palette rule turn out
// to be the same rule — no new colour, and no second meaning for the accent.
//
// **Terse, and not Opta's prose.** Their commentary runs to 180 characters
// (*"Goal! Ipswich Town 0, Liverpool 1. Alexander Isak (Liverpool) right footed
// shot from the right side of the box to the top right corner. Assisted by Cody
// Gakpo with a through ball."*) and the round-level read that gives us every
// goal in one request carries no prose at all. Both point the same way:
// PRODUCT.md's voice is *"terse, confident, footballing"*, and the vidiprinter's
// own register is `IPSWICH 0 LIVERPOOL 2 (Isak 9)`. A goal, a scoreline, a name,
// and whose he is.

export default function Flash({
  goal,
  line,
  fixture,
  clubs,
}: {
  /** The newest goal in the round, or null when nobody has scored yet. */
  goal: MatchEvent | null;
  /** The same goal as a wire line, which is where the owner and the man are. */
  line: WireLine | null;
  fixture: Fixture | null;
  clubs: Map<number, Club>;
}) {
  // Nothing yet is nothing to say. Drawn only once there is a goal in the round:
  // a plate reading "no goals" is furniture, and the fixtures underneath already
  // say the round is goalless.
  if (goal === null || line === null || fixture === null) return null;

  const home = clubs.get(fixture.homeClubId)?.shortName ?? "—";
  const away = clubs.get(fixture.awayClubId)?.shortName ?? "—";
  const word = goal.kind === "own-goal" ? "Own goal" : goal.kind === "penalty-goal" ? "Penalty" : "Goal";

  return (
    <section
      className={
        line.man?.mine === true
          ? // Accent fill with the page's own ground as ink: 13.1:1, and both
            // halves of the pair are already in DESIGN §3's table.
            "flex min-h-14 items-center gap-3 bg-accent px-3 text-bg lg:min-h-9"
          : // The same raised plate the tab strip and the column heads are cut
            // from, and it owns its ink — no `text-*` here.
            "cm-bevel flex min-h-14 items-center gap-3 px-3 lg:min-h-9"
      }
    >
      <span className={`${SMALL_CAPS} shrink-0`}>{word}</span>
      <span className="numeric shrink-0 text-sm font-bold">
        {home} {fixture.homeScore ?? 0}
        <span className="px-1">&ndash;</span>
        {fixture.awayScore ?? 0} {away}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold">
        {line.man?.player.name ?? "—"}
        <span className="numeric pl-1.5 font-normal">{goal.minute}&prime;</span>
      </span>
      {/* Whose he is, which is the half of this sentence no other score centre
          in the world can print. */}
      <span className={`${SMALL_CAPS} shrink-0 truncate`}>
        {line.man?.owner?.teamName ?? <span className="opacity-60">&mdash;</span>}
      </span>
    </section>
  );
}
