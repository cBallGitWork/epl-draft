import { isFplKeeper, DASH } from "@epl/core";
import type { Club, FootballPlayer, FplLine, FplPick, Opposition } from "@epl/core";
import PitchMarker from "../components/league/PitchMarker";
import SubMarker, { type SubMark } from "../components/football/SubMarker";
import PitchRows, { BENCH_KIT, FAR_INSET, GAP_CLASS, cardBasis, rowBudget, widestLine } from "../components/league/PitchRows";

// Your FPL XI on the grass — the same grass as everywhere else.
//
// **It was on the wrong ground and it had its own cell** (Craig, 5 Sep 2026:
// "using the wrong pitch, we use a different pitch elsewhere"). `PitchRows` drew
// two grounds then: `CmGround`, the flat 68x105m diagram, and a photographed
// trapezoid with hoardings and a goal. This file passed neither flag, so it fell
// through to the trapezoid and drew a `Sticker` of its own beside it. The same
// complaint reached the last trapezoid on 21 Sep 2026 and that ground is gone;
// `CmGround` is the only one, and there is no flag left to forget.
//
// The planner's own sticker justified the copy on the grounds that it "takes a
// `RosteredPlayer`, which is a Fantrax roster slot joined to a footballer, and an
// FPL pick is neither". That stopped being true on 3 Sep, when the disc was
// changed to take a plain `FootballPlayer` for exactly this reason
// (`PitchMarker`'s own docblock records it); the sticker itself went on 21 Sep
// and every eleven in the app is one card.
//
// **`inColumn` as well as `flat`**, which `prem/club/[code]/Eleven` records the
// cost of: bleeding is right for a pitch that is the widest thing on a screen,
// and full-bleed made this one 1,132 wide and 1,192 tall — 552px past the fold at
// 1440, of which 622 was empty grass under the keeper. The ratio is on `.pitch`
// and multiplies whatever width it is given, so the width is the only lever.
//
// **Every number here is FPL's, already multiplied.** A captain's 18 is what he
// contributed, not what he scored, which is the number a manager is looking for.

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
  /** Each club's fixtures this round, so the disc can tell for itself whether a
   *  man's club has kicked off. It draws him back until it has, and prints his
   *  club rather than a nought — `played.ts`'s predicate is still what the round
   *  total and the bench need, but the grass no longer asks it. */
  opposition: Map<number, Opposition[]>;
  /** Who came on or went off in his real match, by FPL code. */
  subs: Record<number, SubMark>;
}) {
  // A benched man shows what he scored; his pick's own points are multiplied by nought.
  const marker = (pick: FplPick, benched = false) => {
    const player = players.get(pick.code) ?? null;
    const mark = subs[pick.code];
    return (
      <SubMarker minute={mark?.minute ?? null} off={mark?.off ?? false}>
        <Pick
          pick={pick}
          points={benched ? pick.scored : pick.points}
          player={player}
          club={player === null ? undefined : clubs.get(player.clubId)}
          opposition={player === null ? undefined : opposition.get(player.clubId)}
        />
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

/** One pick: the shared disc, with the armband over it.
 *
 *  **The armband is drawn HERE and not by `PitchMarker`.** It is the one fact on
 *  this pitch that no other pitch has — our league has no captain — so a prop for
 *  it would be a mechanism with one caller, which CODE_RULES §1 forbids by name.
 *  The disc's own root is already `relative`, and this wrapper is the caller's,
 *  so the badge sits over the head without either side knowing about the other.
 *
 *  No club colours on the fill. Eleven picks are eleven different clubs, and
 *  `PitchMarker` records eleven palettes on one pitch as already tried and
 *  rejected — the chrome default is what a pitch with no single team gets. */
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
      {/* FPL names both a captain and a vice, and which one actually doubled is
          decided after the fact — so the vice is drawn whether or not there is a
          captain to outrank him. */}
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
