import Link from "next/link";
import type { LeagueTeam, LiveTeamScore, PeriodPairing, PendingCleanSheets } from "@epl/core";
import { yoursBorder } from "../../mine";

// One head-to-head on the list of eight. Extracted from the page, which had
// grown past the file ceiling with the card inlined — and the card is about to
// be the thing that changes, so it needed a file of its own first.

/** Whether a manager has a stake in this pairing. Null team id — a reader who
 *  has not signed in — has a stake in none of them, which is the neutral list.
 *
 *  Exported because the page orders by the same question it marks by, and two
 *  spellings of "is this one mine" is how a list comes to put a card first and
 *  then not mark it. */
export function involves(pairing: PeriodPairing, teamId: string | null): boolean {
  return teamId !== null && (pairing.home.teamId === teamId || pairing.away.teamId === teamId);
}

export default function PairingCard({
  pairing,
  scores,
  pending,
  mine,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  pending: Map<string, PendingCleanSheets>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
}) {
  return (
    <div
      className={`elev flex flex-col rounded-xl border bg-surface py-1 ${yoursBorder(
        involves(pairing, mine),
      )}`}
    >
      <Side
        team={pairing.home}
        score={scores.get(pairing.home.teamId)}
        pending={pending.get(pairing.home.teamId)}
        mine={pairing.home.teamId === mine}
      />
      <span className="px-3 text-center text-2xs font-bold uppercase tracking-widest text-faint">
        vs
      </span>
      <Side
        team={pairing.away}
        score={scores.get(pairing.away.teamId)}
        pending={pending.get(pairing.away.teamId)}
        mine={pairing.away.teamId === mine}
      />
    </div>
  );
}

function Side({
  team,
  score,
  pending,
  mine,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  mine: boolean;
}) {
  return (
    // Into the pairing's own board, opened on the side that was tapped — not
    // into the squad. Both sides of a card lead to the same head-to-head and it
    // arrives showing whichever name the thumb landed on, which is the whole of
    // what "tap a team" means here. Each squad is one further tap, from there.
    <Link
      href={`/league/matchups/${team.teamId}`}
      className="flex min-h-11 items-center gap-3 px-3 py-2 hover:bg-raised"
    >
      <span className={`min-w-0 flex-1 truncate ${mine ? "font-bold text-ink" : "font-semibold"}`}>
        {team.name}
      </span>
      {/* Per side, not per league: once football is on, one manager has three
          players left and the other has none, and that difference is most of
          what a head-to-head screen is for. */}
      {score?.toPlay ? (
        <span className="shrink-0 text-2xs text-faint">{score.toPlay} to play</span>
      ) : null}
      {/* Kept beside the score rather than folded into it. Fantrax's number stays
          Fantrax's; this is the bit they have not credited yet. */}
      {pending && pending.points > 0 ? (
        <span className="numeric shrink-0 text-sm font-semibold text-accent">
          +{pending.points}
        </span>
      ) : null}
      {/* A team we have no number for gets a dash, never a nought: those are
          different claims and only one of them is a score. */}
      <span className="numeric w-10 text-right text-lg font-bold">{score?.points ?? "—"}</span>
    </Link>
  );
}
