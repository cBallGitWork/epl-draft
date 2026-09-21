import Link from "next/link";
import { headToHead, type LeagueTeam, type LiveTeamScore, inkOn, teamColours } from "@epl/core";
import { liveScores } from "../scoreboard";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";

// Your head-to-head, at the top of the live view.
//
// The whole point of the Matchday tab: not "what is happening in the Premier
// League" — that is below — but "am I winning". It renders nothing at all when
// there is nothing to say, so a reader who has not signed in, or whose league
// has not drafted, gets the football and no empty furniture.
//
// **It wears Championship Manager's match header, and that is a DEPARTURE from
// the grammar the other two share.** This block used to say "one scoreline row,
// the same grammar as the head-to-head board and the matchups list", and
// `docs/ui/matchday.md` still says all three surfaces share one — neither is
// true of this file any more, and the change was made deliberately (4 Sep 2026)
// rather than drifted into.
//
// The reason: on a screen carrying a wire, five draft ties and ten fixtures, a
// scoreline ROW is one row among sixteen and nothing outranks anything.
// PRODUCT.md's first principle is that the live number is the interface, so the
// tie takes the two club-coloured plates `cm9900/21.jpg` gives a MATCH and the
// rest of the screen becomes subordinate to it. The list and the board keep the
// row, because on those screens it is the thing itself rather than the headline.
//
// **Stripped to the scoreline** (Craig, 21 Sep 2026). It carried a label row
// with a way through to the board, and a line under it reading "all played" and
// the round's state. Both are gone: either plate is still the link to the board,
// and the round's state is on the page's own title bar two panels up.
//
// **What it costs, stated so nobody re-discovers it as a bug**: `ScoreFigure`
// cannot come inside a `cm-bevel` — DESIGN §2, ink on that plate is 2.27:1 —
// so this is the one head-to-head in the app whose trailing figure does not dim
// and whose dash is kept by hand. The board stays one tap behind: this answers
// "am I winning", and the board answers "with whom", which is the question the number
// provokes rather than the question itself.

export default async function YourMatchup() {
  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return null;

  const period = squads.roundPeriod;
  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return null;

  // You on the left, whoever it is on the right. Fantrax's home and away mean
  // nothing here — there is no ground — and a manager reads his own score first.
  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, mine);
  if (!pairing) return null;

  const { scores } = await liveScores(period);
  const yours = scores.get(pairing.team.teamId);
  const theirs = scores.get(pairing.opponent.teamId);

  return (
    <section className={`cm-panel flex flex-col gap-2 p-2 ${yoursBorder(true)}`}>
      <div className="flex items-stretch">
        <Half team={pairing.team} score={yours} mine />
        <Half team={pairing.opponent} score={theirs} />
      </div>

    </section>
  );
}

function Half({
  team,
  score,
  mine = false,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  mine?: boolean;
}) {
  const points = score?.points ?? null;
  const colours = teamColours(team.teamId);
  const ink = inkOn(colours);

  return (
    // Championship Manager's match header, with the managers where the clubs
    // are: `cm9900/21.jpg` sets Everton's blue against Arsenal's red and
    // `16.jpg` sets the same blue against Torquay's WHITE, so a pale side is a
    // case the reference has rather than an edge we invented — `inkOn` answers
    // it. Neither plate is mirrored and each score sits at ITS OWN right edge,
    // which is `MatchBar`'s recorded correction (Craig, 4 Sep: "the scores go on
    // the right hand side of each team row, currently its centered").
    <div
      className={`flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${
        mine ? "border-l-4 border-l-accent" : ""
      }`}
      style={{ background: colours.primary }}
    >
      <Link
        href={`/league/matchups/${team.teamId}`}
        className="flex min-w-0 flex-1 items-center self-stretch px-2"
      >
        {/* Accent ink is unavailable on a colour plate, so "yours" is carried by
            the edge and by position — `mine.ts`'s own mark, and the reason it
            exists as a border rather than only as an ink. */}
        <span
          className="cm-title min-w-0 flex-1 truncate font-chrome text-base font-bold uppercase lg:text-2xl"
          style={{ color: ink }}
        >
          {team.name}
        </span>
      </Link>
      {/* **The plate owns its ink**, so nothing sets `text-*` in here. That is
          not a style note: `--color-ink` on the grey bevel is 2.27:1 and the
          dimmed trailing side is lower still, which is why `ScoreFigure` — whose
          whole job is to dim the trailing figure — may not come inside the box.
          The dash for a total Fantrax did not give is kept by hand. */}
      {/* Narrower and a step smaller under a thumb than on the desk, measured:
          at `w-16 text-2xl` the away plate had 79px for a name and clipped
          `test31` to `TEST…`. A manager's own name may not truncate on the one
          screen that is about him, and the score is still the biggest figure on
          the page at `text-xl`. `w-14` holds a Fantrax total's four characters
          (`61.4`), which is the widest thing this box ever carries. */}
      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? "\u2014" : points}
      </span>
    </div>
  );
}
