import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  clubColours,
  clubStats,
  crestUrl,
  inkOn,
  leagueTable,
  ordinal,
} from "@epl/core";
import Caption from "../../../components/shell/Caption";
import Nothing from "../../../components/shell/Nothing";
import PageHeader from "../../../components/shell/PageHeader";
import ButtonLink from "../../../components/shell/ButtonLink";
import { footballNow, seasonFixtures } from "../../../football";

// One club, and for now only what the table already knows about it.
//
// **A stub on purpose** (Craig, 2 Sep: "clicking a team takes them to their team
// page — build links, we scaffold that later"). Every club name in this section
// is a link, and a link to a 404 is worse than no link: this is the page those
// links land on, carrying the club's identity and its record, with the room for
// a squad, a fixture run and a season underneath it left visibly empty rather
// than filled with something invented.
//
// **A club bar, not a competition bar.** CM draws two and which one you get says
// what KIND of thing the screen is about: `cm9900/24.jpg` is the division —
// light plate, blue title — and `25.jpg` is Everton, a filled plate carrying the
// name. A club is somebody IN the competition rather than the competition, so it
// takes the second, in that club's own colours. `squad/[teamId]/Shell` does the
// identical thing for a fantasy side, and `inkOn` is what keeps a pale club
// readable — it picks dark ink for a light plate, which is `cm9900/16.jpg`'s
// white Torquay and not a case we invented.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function ClubPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const wanted = Number(code);
  // Reject anything that is not a plain club code before asking FPL for it —
  // "3.5" and "3abc" both coerce to something `Number` will happily accept.
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const club = snapshot.clubs.find((entry) => entry.code === wanted);
  if (club === undefined) notFound();

  const table = leagueTable(fixtures, snapshot.clubs);
  const place = table.findIndex((row) => row.clubId === club.id);
  const row = place === -1 ? undefined : table[place];
  const stats = clubStats(fixtures, snapshot.clubs, []).find((entry) => entry.clubId === club.id);

  const colours = clubColours(club.shortName);
  const plate = { background: colours.primary, ink: inkOn(colours) };

  return (
    // The club's colour set once for the whole page: `--cm-index` re-points the
    // blue block every CM table runs down its left, so a club's screens are its
    // own rather than the division's. `squad/[teamId]/Shell` scopes it the same
    // way and for the same reason.
    <div
      className="flex flex-col gap-2"
      style={{ "--cm-index": plate.background, "--cm-index-ink": plate.ink } as CSSProperties}
    >
      <PageHeader title={club.name} plate={plate} />
      <Caption>{row === undefined ? "Club" : `${ordinal(place + 1)} in the Premiership`}</Caption>

      <section className="cm-panel flex flex-col gap-3 p-3">
        <div className="flex items-center gap-3">
          <Image
            src={crestUrl(club)}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
            aria-hidden
            unoptimized
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{club.name}</p>
            <p className="numeric text-2xs text-faint">{club.shortName}</p>
          </div>
        </div>

        {row === undefined || stats === undefined ? (
          <Nothing title="Not in this season's table" code={`club code ${club.code}`}>
            FPL names this club but has published no fixtures we can build a record from.
          </Nothing>
        ) : (
          <dl className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
            <Figure label="Played" value={row.played} />
            <Figure label="Won" value={row.won} />
            <Figure label="Drawn" value={row.drawn} />
            <Figure label="Lost" value={row.lost} />
            <Figure label="For" value={row.goalsFor} />
            <Figure label="Against" value={row.goalsAgainst} />
            <Figure label="Clean sheets" value={stats.cleanSheets} />
            <Figure label="Points" value={row.points} />
          </dl>
        )}

        {/* Said rather than left blank. A screen that simply stops is one a
            reader assumes is broken; this one is honest about being early. */}
        <p className="text-2xs text-faint">
          The squad, the fixture run and the season are still to come. Until then this is what
          the table knows.
        </p>
      </section>

      <ButtonLink href="/prem">Back to the table</ButtonLink>
    </div>
  );
}

/** One figure and its name, on the fact-row shape `/players/[fantraxId]` uses. */
function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-11 items-center gap-2.5 border border-line bg-surface px-3 py-2">
      <dt className="min-w-0 flex-1 truncate text-sm text-muted">{label}</dt>
      <dd className="numeric font-bold">{value}</dd>
    </div>
  );
}
