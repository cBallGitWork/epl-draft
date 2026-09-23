import { goalGroups } from "@epl/core";
import type {
  FootballPlayer,
  PlGoal,
  PlManMatch,
  PlayerOwner,
  SheetRow,
} from "@epl/core";
import { Goal, Man } from "./ScoreRows";
import type { SquadPlayerDetail } from "@epl/core";

// Who scored, when, and who made it.
//
// **A list of GOALS, not of men, folded to one line per SCORER.** A man-list
// gives a scorer and an assister the same white name and the same yellow minute
// and nothing but prior knowledge tells them apart (Craig, 10 Sep 2026: *"so
// now, goals and assists look the same"*); a goal-list repeats a man's own name
// over his second goal, which says nothing the minute beside it had not (Craig,
// 11 Sep 2026: *"isak can have one row only for both goals"*). So: the scorer on
// the line with all his minutes, the men who made them under him, quieter and
// smaller. `goalGroups` in core does the folding and is tested there.
//
// **The owner rides in brackets after the name**, scorer and assister alike
// (*"owner name can go after ISAK (put in brackets), saves a row"*). A league
// team name is a gloss on the name it follows, not a fact with a row of its own,
// and this is the screen with the fewest facts in the app.
//
// **An assister carries a minute unless it would only repeat the line above
// him**, which is exactly when he made EVERY one of that scorer's goals —
// position has already said it, because he sits under the man whose goals they
// were. He is in the opposite case two ways, and both are real rows:
//
//   - two assisters on a brace, where `A Semenyo 17'` over `A Foden 84'` is the
//     only thing pairing each man with his goal; and
//   - one assister on a hat-trick — Bruno Fernandes scored 40', 61' and 68'
//     against Ipswich with Cunha on the 40' alone, and a bare `A Cunha` under
//     `40', 61', 68'` reads as though he made all three.
//
// Hence `his.length !== group.minutes.length`, and not a count of assisters.
// *Three attempts at this rule shipped in one afternoon — no minute, a minute
// always, a minute only on a second assister — and the two failures are worth a
// line because each looked right against the fixture in front of it.*
//
// What tells a goal from an assist never rested on the minute: the ball, the
// `A`, the indent, the ink and the size are five marks without it.
//
// **The ball marks the goal line.** `EventIcon`'s own rule is that a glyph
// stands beside a word and never instead of one; here the word is the name and
// the minute, which is what CM's sheet is. `aria-hidden`, sized in `em`, so it
// takes the size of whatever box holds it — see `Man` for why that box states
// one.
//
// **CM's own arrangement otherwise.** `cm0102/02.jpg` prints the home scorers
// down the left and the away down the right with the minute in yellow beside
// each. Neither column is mirrored: the reference sets both sides name-first
// with the figure to its right, and the side is carried by WHICH COLUMN a name
// is in.
//
// **The type is set at CM's size**, which is the recorded exception DESIGN §6
// carries: this is a screen whose entire content is a few names and a few
// minutes, and the game sets them large enough to read across a room. Craig,
// 11 Sep 2026: *"can make scorer and minute font bigger"* — the desk step went
// with it, where `02.jpg` sets a scorer at about 2.2% of its canvas.

export default function Scoresheet({
  home,
  away,
  homeElse,
  awayElse,
  owners,
  byCode,
  did,
  injured,
  men,
}: {
  /** One side's goals, oldest first, with assisters already reconciled against
   *  FPL's counts by `creditedGoals`. */
  home: readonly PlGoal[];
  away: readonly PlGoal[];
  /** Men the sheet names for something that is not a goal — a sending off, a
   *  penalty missed. Kept because a scoresheet carries them and a goal list on
   *  its own would drop them. */
  homeElse: readonly SheetRow[];
  awayElse: readonly SheetRow[];
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
  /** What the Premier League's events say happened to each man, for the one
   *  thing FPL's per-fixture line cannot give: the MINUTE of a sending off. */
  did: Map<number, PlManMatch>;
  /** Who went off hurt, and when — from the commentary, which is the only place
   *  that says so (Craig, 11 Sep 2026: *"i want them on the overview"*). */
  injured: ReadonlyMap<number, number>;
  /** Each named man's card, by code — a name opens his card, not his page. */
  men: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  const empty =
    home.length === 0 && away.length === 0 && homeElse.length === 0 && awayElse.length === 0;
  if (empty) {
    return (
      <p className="py-2 text-center text-2xs text-faint">Nobody was named on the scoresheet.</p>
    );
  }

  return (
    // `data-tap-exception`: 36px rows under a thumb, PRODUCT's recorded exception, which `tapfit` reads out.
    <div className="grid grid-cols-2 gap-x-3 gap-y-1" data-tap-exception="match-row">
      <Column goals={home} rest={homeElse} owners={owners} byCode={byCode} did={did} injured={injured} men={men} />
      <Column goals={away} rest={awayElse} owners={owners} byCode={byCode} did={did} injured={injured} men={men} />
    </div>
  );
}

function Column({
  goals,
  rest,
  owners,
  byCode,
  did,
  injured,
  men,
}: {
  goals: readonly PlGoal[];
  rest: readonly SheetRow[];
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
  did: Map<number, PlManMatch>;
  injured: ReadonlyMap<number, number>;
  men: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  return (
    <ul className="flex max-w-[26rem] flex-col gap-1">
      {goalGroups(goals).map((group) => (
        <Goal
          key={`${group.scorer ?? "?"}-${group.own}-${group.minutes[0]}`}
          group={group}
          owners={owners}
          byCode={byCode}
          men={men}
        />
      ))}
      {rest.map(({ player, line }) => {
        // **An injury outranks a missed penalty for the mark**, because it is the
        // one of the two a reader is scanning the sheet for. A sending off
        // outranks both: `chipsFor`'s own ordering principle, read at one row.
        // **The FIXTURE FEED's minute, and the commentary's only as a fallback.**
        // The two disagree by one: their `OFF` row puts Nketiah at 45' and the
        // commentary line at 46'. Neither is wrong — they are two clocks — but
        // the Line Ups board prints `sub off 45'` for the same man, and one
        // screen may not contradict another about a fact this simple. The
        // commentary is what SAYS he was hurt; the feed is what times it.
        const man = player.code === null ? undefined : did.get(player.code);
        const hurtAt =
          player.code === null || !injured.has(player.code)
            ? undefined
            : (man?.offAt ?? injured.get(player.code));
        return (
          <li key={player.id}>
            <Man
              code={player.code}
              card={player.code === null ? undefined : men.get(player.code)}
              name={player.name}
              owners={owners}
              figure={marks(line, man, hurtAt)}
              glyph={line.redCards > 0 ? "card" : hurtAt === undefined ? null : "cross"}
              glyphTone="text-bad"
            />
          </li>
        );
      })}
    </ul>
  );
}

/** What a man is on the sheet for when it is not a goal.
 *
 *  A sending off, a penalty missed and a man carried off are scoresheet entries
 *  and a list of goals would drop them. A booking is not — `named` stopped
 *  letting one on this sheet on 10 Sep 2026.
 *
 *  Takes the man's PL events as well as his FPL line, because only one of the
 *  two carries a minute for a sending off. */
function marks(
  line: SheetRow["line"],
  did: PlManMatch | undefined,
  hurtAt: number | undefined,
): string {
  const said: string[] = [];
  if (line.penaltiesSaved > 0) said.push("pen saved");
  if (line.penaltiesMissed > 0) said.push("pen missed");
  // **The MINUTE, not the word** (Craig, 11 Sep 2026: *"red card has a card, we
  // just need the minute now instead of red text on overview"*). The red block
  // beside the name already says what happened; `red` in the figure column said
  // it a second time and put a word where every other row on this sheet carries
  // a clock. Falls back to the word where the Premier League filed no minute —
  // a sending off we cannot time is still a sending off.
  if (line.redCards > 0) said.push(did?.sentOff == null ? "red" : `${did.sentOff}'`);
  // **The minute he went off**, which is the same shape the sending off takes
  // and the same shape every goal on this sheet takes: the cross beside the name
  // has already said WHAT, so the figure column says WHEN.
  if (hurtAt !== undefined) said.push(`${hurtAt}'`);
  return said.join(" · ");
}
