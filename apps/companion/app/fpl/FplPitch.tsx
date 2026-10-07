import { fullFootballerName, isFplKeeper, kickedOff, matchesOver, DASH } from "@epl/core";
import type { Club, FootballPlayer, FplLine, FplPick, Opposition } from "@epl/core";
import PitchMarker from "../components/league/PitchMarker";
import SubMarker, { type SubMark } from "../components/football/SubMarker";
import PitchRows, { BENCH_KIT, FAR_INSET, GAP_CLASS, cardBasis, rowBudget, widestLine } from "../components/league/PitchRows";
import PickPoints from "./PickPoints";

// Your FPL XI on the app's one pitch, the bench as kits under it. Every number is FPL's:
// the XI's are multiplied (a captain's 18 is what he contributed), the bench's are what each man scored.

export default function FplPitch({
  rows,
  bench,
  players,
  clubs,
  opposition,
  subs,
}: {
  rows: FplLine[];
  /** The four who did not start, in the order FPL would bring them on. */
  bench: FplPick[];
  players: Map<number, FootballPlayer>;
  clubs: Map<number, Club>;
  /** Each club's fixtures this gameweek: until his club kicks off, the disc prints the club, not a nought. */
  opposition: Map<number, Opposition[]>;
  /** Who came on or went off in his real match, by FPL code. */
  subs: Record<number, SubMark>;
}) {
  // A benched man shows what he scored; his pick's own points are multiplied by nought.
  const marker = (pick: FplPick, benched = false) => {
    const player = players.get(pick.code) ?? null;
    const club = player === null ? undefined : clubs.get(player.clubId);
    const fixtures = player === null ? undefined : opposition.get(player.clubId);
    const mark = subs[pick.code];
    return (
      <SubMarker minute={mark?.minute ?? null} off={mark?.off ?? false}>
        <PickPoints
          pick={pick}
          name={player === null ? DASH : fullFootballerName(player)}
          club={club?.shortName ?? null}
          started={kickedOff(fixtures)}
          over={matchesOver(fixtures)}
        >
          <Pick
            pick={pick}
            points={benched ? pick.scored : pick.points}
            player={player}
            club={club}
            opposition={fixtures}
          />
        </PickPoints>
      </SubMarker>
    );
  };
  return (
    // Bounded by the fold: `.pitch-fpl`'s `--pitch-page` is what the page keeps for everything not grass,
    // and the width is capped at the height that leaves, so the XI and the bench fit one screen.
    <div className="pitch-fpl mx-auto w-full lg:max-w-[calc((100svh-var(--pitch-page))*var(--pitch-ratio))]">
      <PitchRows rows={rows} keyOf={(pick: FplPick) => String(pick.code)} inColumn>
        {(pick) => marker(pick)}
      </PitchRows>
      {/* The bench as kits under the grass, first on at the left (Craig, 25 Sep 2026: "show bench"). */}
      {bench.length === 0 ? null : (
        <ul
          className={`pitch-strip flex justify-center border-t border-line bg-surface pb-2 pt-1.5 ${GAP_CLASS}`}
          style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows.length), ...BENCH_KIT }}
        >
          {bench.map((pick, at) => (
            <li key={pick.code} className="min-w-0 shrink-0" style={{ flexBasis: cardBasis(widestLine(rows)) }}>
              <p className="flex items-center justify-center pb-0.5 leading-none">
                <span className="cm-index numeric px-1 text-3xs">{at + 1}</span>
              </p>
              {marker(pick, true)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One pick: the shared disc with the armband drawn over it here, since only FPL has a captain. */
function Pick({
  pick,
  points,
  player,
  club,
  opposition,
}: {
  pick: FplPick;
  points: number;
  player: FootballPlayer | null;
  club: Club | undefined;
  opposition: Opposition[] | undefined;
}) {
  return (
    <span className="relative block w-full">
      <PitchMarker
        player={player}
        // A pick FPL names and the bootstrap does not — signed since, or an
        // academy name. He still has a club, so he still gets its kit.
        label="?"
        name={player?.name ?? DASH}
        keeper={isFplKeeper(pick.line)}
        club={club}
        opposition={opposition}
        points={points}
      />
      {/* Which of captain and vice doubled is decided after the fact, so both are drawn. */}
      {pick.isCaptain || pick.isViceCaptain ? (
        <span
          aria-hidden
          className={`absolute left-0.5 top-0.5 z-base grid h-4 w-4 place-items-center rounded-full text-[0.5rem] font-bold ${
            pick.isCaptain ? "bg-info text-bg" : "bg-black/60 text-cream"
          }`}
        >
          {pick.isCaptain ? "C" : "V"}
        </span>
      ) : null}
    </span>
  );
}
