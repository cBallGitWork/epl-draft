import Link from "next/link";
import { clubById, clubColours, clubStats, nextFixtures, ordinal, plateOn } from "@epl/core";
import type { Club } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { fdrStep } from "../../../../components/football/FixtureChip";
import { londonDayAndTime } from "../../../../londonTime";
import { CLUB } from "../../../PremNav";
import ClubShell from "../Shell";
import Comparison from "../Comparison";
import { clubOr404, standing } from "../club";

// Who they play next, and the one club screen that is about a confrontation.
//
// **Two plates, because this is about a fixture.** `squad/[teamId]/next` says
// why: Championship Manager sets two sides' own colours against each other in a
// match header — Everton's blue against Arsenal's red in `cm9900/21.jpg`,
// against Torquay's WHITE in `16.jpg` — and that is the whole of what club
// colour does in the game.
//
// **Home reads first here, and does not on the fantasy screen.** A fantasy
// fixture has no ground, so that one leads with whoever's page you are on. A
// real one does, and a match header that put the away side left would be
// printing the fixture backwards.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function ClubNextPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);

  // The season's fixtures, not the round in view: the next match may be weeks
  // away for a club whose gameweek is a blank.
  const [next] = nextFixtures(fixtures, clubById(snapshot), club.id, 1);

  return (
    <ClubShell club={club} title="Next Match" current="next" empty={next ? [] : ["next"]}>
      {next === undefined ? (
        <TabEmpty>Every match FPL has published with {club.name} in it has been played.</TabEmpty>
      ) : (
        <Fixture
          club={club}
          fixture={next}
          stats={clubStats(fixtures, snapshot.clubs, snapshot.players)}
          place={(entry: Club) => standing(fixtures, snapshot.clubs, entry)?.place}
        />
      )}
    </ClubShell>
  );
}

function Fixture({
  club,
  fixture,
  stats,
  place,
}: {
  club: Club;
  fixture: ReturnType<typeof nextFixtures>[number];
  stats: ReturnType<typeof clubStats>;
  place: (club: Club) => number | undefined;
}) {
  const opponent = fixture.club;
  // `nextFixtures` answers from the subject club's point of view, so `home`
  // says whether IT is at home — which is what decides the order below.
  const [homeClub, awayClub] = fixture.home ? [club, opponent] : [opponent, club];

  const record = (entry: Club, at: "home" | "away") =>
    stats.find((row) => row.clubId === entry.id)?.[at];
  const home = record(homeClub, "home");
  const away = record(awayClub, "away");

  return (
    <section className="cm-panel flex flex-col">
      <div className="cm-tab flex items-center justify-between gap-2 px-2 py-1">
        <span className="numeric text-2xs font-bold uppercase text-ink">
          {fixture.fixture.gameweek === null
            ? "Gameweek TBC"
            : `Gameweek ${fixture.fixture.gameweek}`}
        </span>
        <span className="numeric text-2xs font-bold text-ink">
          {/* TBC rather than a guessed date: FPL leaves `kickoff_time` null on a
              match the television has not picked, and inventing one is the
              confident wrong answer DESIGN §7 is about. */}
          {fixture.fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.fixture.kickoff)}
        </span>
      </div>

      <div className="flex items-stretch gap-2 p-2">
        <Side club={homeClub} rank={place(homeClub)} linked={homeClub.id !== club.id} />
        <span className="flex shrink-0 items-center px-1 font-chrome text-2xs font-bold uppercase text-faint">
          v
        </span>
        <Side club={awayClub} rank={place(awayClub)} linked={awayClub.id !== club.id} />
      </div>

      {/* FPL's opinion of the tie, labelled as FPL's. It is an opinion and the
          only one in this section, so it is never printed as a fact. */}
      {fixture.difficulty === null ? null : (
        <p className="px-2 pb-2 text-2xs text-faint">
          FPL rates this{" "}
          <span
            className={`numeric px-1 font-bold ${fdrStep(fixture.difficulty).ink}`}
            style={{ backgroundColor: fdrStep(fixture.difficulty).ground }}
          >
            {fixture.difficulty}
          </span>{" "}
          out of 5 for {club.shortName}.
        </p>
      )}

      {/* Each side's record where it will actually be standing — the home club's
          home half against the away club's away half. A whole-season record
          either side would compare two numbers neither of which is about this
          fixture. */}
      {home === undefined || away === undefined ? null : (
        <div className="border-t border-line p-2">
          <Comparison
            left={{ label: homeClub.shortName, plate: plate(homeClub) }}
            right={{ label: awayClub.shortName, plate: plate(awayClub) }}
            rows={[
              { label: "Played", left: home.played, right: away.played },
              { label: "Won", left: home.won, right: away.won },
              { label: "Drawn", left: home.drawn, right: away.drawn },
              { label: "Lost", left: home.lost, right: away.lost },
              { label: "For", left: home.goalsFor, right: away.goalsFor },
              { label: "Against", left: home.goalsAgainst, right: away.goalsAgainst },
            ]}
          />
          <p className="pt-2 text-2xs text-faint">
            {homeClub.shortName} at home; {awayClub.shortName} away.
          </p>
        </div>
      )}
    </section>
  );
}

/** A club's plate. Three sites in this file want it — the two sides of the
 *  header and each column of the comparison under them — and `clubColours` is
 *  keyed on the short name, which is a detail none of the three should carry.
 *  Local rather than in core: `plateOn` is the shared primitive and giving it a
 *  club-shaped wrapper there would leave it with one caller of its own. */
function plate(club: Club): { background: string; ink: string } {
  return plateOn(clubColours(club.shortName));
}

function Side({
  club,
  rank,
  linked,
}: {
  club: Club;
  rank: number | undefined;
  linked: boolean;
}) {
  const colours = plate(club);
  const label = (
    <span
      className="flex min-h-11 flex-1 flex-col items-center justify-center px-2 text-center leading-tight"
      style={{ background: colours.background, color: colours.ink }}
    >
      <span className="text-sm font-bold uppercase">{club.name}</span>
      {rank === undefined ? null : (
        <span className="numeric text-3xs font-bold opacity-80">({ordinal(rank)})</span>
      )}
    </span>
  );

  // Only the opponent is a link: a link to the page you are on is a dead control
  // that still looks like a live one.
  return linked ? (
    <Link href={`${CLUB}/${club.code}`} className="flex min-w-0 flex-1">
      {label}
    </Link>
  ) : (
    <span className="flex min-w-0 flex-1">{label}</span>
  );
}
