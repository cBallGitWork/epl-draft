import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clubById, clubColours, crestUrl, inkOn } from "@epl/core";
import type { Club } from "@epl/core";
import Caption from "../../../components/shell/Caption";
import PageHeader from "../../../components/shell/PageHeader";
import ButtonLink from "../../../components/shell/ButtonLink";
import { footballNow, seasonFixtures } from "../../../football";
import { londonDayAndDate, londonTime } from "../../../londonTime";
import { CLUB } from "../../PremNav";
import { PANEL_FLUSH, SCORE_CREST, SCORE_CREST_PX } from "@/app/desk";

// One match.
//
// **A stub on purpose** (Craig, 3 Sep 2026: "clicking a prem fixture takes it
// to match page (just scaffold for now)"). Every score in this section is a
// link, and a link to a 404 is worse than no link: this is where they land,
// carrying the two sides, the score and when it was played, with the room for
// the goals, the line-ups and the match stats left visibly empty rather than
// filled with something invented.
//
// **A competition bar, not a club one.** A match belongs to neither side, so it
// takes neither side's plate — `cm9900/24.jpg`'s light competition plate is the
// one for a screen the division owns, and the two clubs get their own colours
// below it, which is what `21.jpg` does with a match header.
//
// Keyed on FPL's fixture `id`, which is the one identifier a fixture has. Unlike
// a club code or a player code it is not season-stable — but neither is a
// fixture: this match exists in this season and nowhere else, so there is
// nothing for a stable key to outlive.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wanted = Number(id);
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const fixture = fixtures.find((entry) => entry.id === wanted);
  if (fixture === undefined) notFound();

  const clubs = clubById(snapshot);
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Match" competition />
      <Caption>
        {fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`}
      </Caption>

      <section className={PANEL_FLUSH}>
        <div className="cm-tab flex items-center justify-between gap-2 px-2 py-1">
          <span className="numeric text-2xs font-bold uppercase text-ink">
            {fixture.kickoff === null ? "Date TBC" : londonDayAndDate(fixture.kickoff)}
          </span>
          <span className="numeric text-2xs font-bold text-ink">
            {fixture.kickoff === null ? "" : londonTime(fixture.kickoff)}
          </span>
        </div>

        <div className="flex items-stretch gap-2 p-2">
          <Side club={home} />
          <span className="numeric flex shrink-0 items-center px-1 text-lg font-bold">
            {played ? `${fixture.homeScore}–${fixture.awayScore}` : "v"}
          </span>
          <Side club={away} />
        </div>

        <p className="border-t border-line p-2 text-2xs text-faint">
          The goals, the line-ups and the match statistics are still to come. Until then this is
          what the fixture list knows.
        </p>
      </section>

      <ButtonLink href="/prem/results">Back to the results</ButtonLink>
    </div>
  );
}

/** One side, on its own colour and linking to its club — except when the
 *  snapshot does not carry it, which holds the space rather than guessing. */
function Side({ club }: { club: Club | undefined }) {
  if (club === undefined) {
    return <span aria-hidden className="min-h-11 flex-1 border border-dashed border-line" />;
  }
  const colours = clubColours(club.shortName);
  return (
    <Link href={`${CLUB}/${club.code}`} className="flex min-w-0 flex-1">
      <span
        className="flex min-h-11 flex-1 items-center justify-center gap-2 px-2 text-center"
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        <Image
          src={crestUrl(club)}
          alt=""
          width={SCORE_CREST_PX}
          height={SCORE_CREST_PX}
          className={`${SCORE_CREST} object-contain`}
          aria-hidden
          unoptimized
        />
        <span className="min-w-0 truncate text-sm font-bold uppercase">{club.name}</span>
      </span>
    </Link>
  );
}
