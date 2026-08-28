import {
  NOTABLE_SAVES,
  type Club,
  type Pick,
  type TeamOfTheWeek as Eleven,
  isGoalkeeper,
} from "@epl/core";
import Column from "./Column";
import PitchRows, { NAME_SIZE } from "../league/PitchRows";
import PlayerImage from "../league/PlayerImage";

// The best eleven anyone owned this week, standing on grass.
//
// It was eleven rows on hairlines, which is a table: same face-less line eleven
// times, the biggest block on the front page, and the reason the whole paper
// read as a list. A team of the week is a TEAM — it has a shape, and the shape
// is the point of printing it. `PitchRows` already draws one for three other
// screens; this is the fourth, and it costs the page nothing it was not already
// shipping.
//
// The lines come from core, not from a second sort here: `shape` is counted off
// the same lines, so what the heading says and what the pitch draws cannot come
// apart.

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

export default function TeamOfTheWeek({
  eleven,
  clubs,
  mine,
  partial,
  fielded,
}: {
  eleven: Eleven;
  /** The round's clubs, keyed by FPL id — for each cut-out's kit and crest
   *  fallbacks. Looked up once by the page rather than per player. */
  clubs: Map<number, Club>;
  mine: string | null;
  /** Whether the round is still being played. Said in the heading rather than
   *  left to the reader: an eleven picked from four fixtures of ten is not the
   *  week's, and on a Saturday tea-time it fills its forward line with men who
   *  have done nothing simply because every good forward is still to kick off. */
  partial: boolean;
  /** Whether the arrangement these picks were read from is the one that was
   *  actually fielded in the round they report on. False between rounds, once
   *  Fantrax has rolled `getTeamRosters` forward to the period managers are now
   *  editing — at which point who was STARTED is a fact about next week's plan
   *  and this section may not print it. What the players did is football and
   *  stands either way, so the eleven itself is unaffected. */
  fielded: boolean;
}) {
  return (
    <Column title={partial ? "Team of the week so far" : "Team of the week"} aside={eleven.shape}>
      <PitchRows
        rows={eleven.lines.map((line) => ({ label: line.position, players: line.picks }))}
        keyOf={(pick) => String(pick.playerCode)}
      >
        {(pick) => (
          <Man pick={pick} club={clubs.get(pick.clubId)} mine={pick.ownerTeamId === mine} fielded={fielded} />
        )}
      </PitchRows>
    </Column>
  );
}

/** One of the eleven, as he stands.
 *
 *  Deliberately not `PitchPlayer`, which takes a `RosteredPlayer` and prints his
 *  fixture and his Fantrax points. Neither is what this section is about: the
 *  round is over, and the two things worth knowing are what he did and whose he
 *  was. Same cut-out, same plate, different second line.
 */
function Man({
  pick,
  club,
  mine,
  fielded,
}: {
  pick: Pick;
  club: Club | undefined;
  mine: boolean;
  fielded: boolean;
}) {
  return (
    <div className="@container flex flex-col items-center">
      <PlayerImage
        player={{ code: pick.playerCode, name: pick.playerName }}
        club={club}
        keeper={isGoalkeeper(pick.position)}
        // The round he is picked from has been played by definition — a man with
        // no minutes is never considered — so nobody here is drawn back.
        kickedOff
      />
      <p
        className={`w-full truncate rounded-sm bg-bg/75 px-1 text-center font-display ${NAME_SIZE} font-bold leading-4 ${
          mine ? "text-accent" : "text-cream"
        }`}
      >
        {pick.playerName}
      </p>
      <p className="numeric w-full truncate text-center text-2xs leading-3 text-cream/90">
        {did(pick)}
      </p>
      <p className="w-full truncate text-center text-2xs leading-4 text-cream/60">
        {/* The best story on the page: his own manager left him out. Said only
            of a lineup we know he was left out of. */}
        {!fielded || pick.started ? pick.ownerName : `${pick.ownerName} · benched`}
      </p>
    </div>
  );
}
