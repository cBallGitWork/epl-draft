import Image from "next/image";
import {
  type Club,
  type Fixture,
  type FootballPlayer,
  type FootballSnapshot,
  type PlayerOwner,
  clubById,
  clubColours,
  contributions,
  crestUrl,
  fixturesInOrder,
} from "@epl/core";
import { londonDay, londonDayAndTime, londonTime } from "../../londonTime";
import { chipsFor } from "../league/Chips";
import { yoursBorder } from "../../mine";
import PlayerPortrait from "./PlayerPortrait";

// The matchday list. Each fixture is a native <details> so the drop-down works
// with no JavaScript, is keyboard operable and screen-reader announced for free —
// reinventing a disclosure widget here would be the product-register mistake.

export default function MatchList({
  snapshot,
  mine,
  owners,
}: {
  snapshot: FootballSnapshot;
  /** Which of the reader's players are in each fixture, by squad membership.
   *  Absent for a reader who is signed out, holds nobody, or whose league
   *  Fantrax would not describe — and the list then renders exactly as it did
   *  before any of this existed. */
  mine?: Map<number, FootballPlayer[]>;
  /** Every rostered footballer in the league, by FPL code, against the squad
   *  holding him. Independent of `mine`: a signed-out reader still gets "whose
   *  player is that", which is the half of the question that is not about him. */
  owners?: Map<number, PlayerOwner>;
}) {
  const clubs = clubById(snapshot);
  const fixtures = fixturesInOrder(snapshot);

  if (fixtures.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
        No fixtures scheduled for this gameweek yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {fixtures.map((f) => (
        <li key={f.id}>
          <MatchRow
            fixture={f}
            clubs={clubs}
            snapshot={snapshot}
            yours={mine?.get(f.id)}
            owners={owners}
          />
        </li>
      ))}
    </ul>
  );
}

function MatchRow({
  fixture,
  clubs,
  snapshot,
  yours,
  owners,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  snapshot: FootballSnapshot;
  /** His players in this match, or undefined when there are none. */
  yours?: FootballPlayer[];
  owners?: Map<number, PlayerOwner>;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const rows = contributions(snapshot, fixture.id);
  const live = fixture.status === "live";

  return (
    <details
      className={`group overflow-hidden rounded-xl border bg-surface elev ${yoursBorder(
        yours !== undefined,
      )}`}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-raised [&::-webkit-details-marker]:hidden"
        // Nothing to expand when nothing happened — say so rather than opening
        // onto an empty panel.
        aria-label={`${home?.name ?? "Home"} versus ${away?.name ?? "Away"}`}
      >
        <ClubSide club={home} align="start" />
        <ScoreBlock fixture={fixture} />
        <ClubSide club={away} align="end" />
        {/* Counted rather than tinted. A bare accent wash saturates once fifteen
            players span ten fixtures — every row marked is no row marked — and
            the number is what ranks one match above another at a glance. */}
        {yours ? (
          <span className="numeric shrink-0 text-2xs font-semibold text-accent">
            {yours.length} yours
          </span>
        ) : null}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="border-t border-line bg-bg/40 px-3 py-2.5">
        {/* Above the contributions, because it answers a different question.
            `contributions` lists only the notable; "which of mine is in this
            match" has to include the man who has done nothing, which on a
            Saturday is most of them. */}
        {yours ? (
          <p className="mb-2 truncate text-xs text-accent">
            <span className="font-semibold uppercase tracking-wide">Yours</span>
            {yours.map((p) => ` · ${p.name}`).join("")}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="py-1 text-center text-xs text-faint">
            {live || fixture.status === "finished"
              ? "Nothing to report yet."
              : `Kicks off ${fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff)}`}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((c) => {
              const club = clubs.get(c.clubId);
              const owner = owners?.get(c.player.code);
              return (
                <li key={c.player.id} className="flex items-center gap-2.5">
                  <PlayerPortrait player={c.player} colours={clubColours(club?.shortName ?? "")} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-sm font-medium">{c.player.name}</span>
                    {/* Whose player that was. The one line of Soccer Saturday
                        the app was missing: every goal in the round now answers
                        it, and a footballer nobody in the league holds says
                        nothing rather than "—", which would be a tag on 500 of
                        the 697. */}
                    {owner ? (
                      <span
                        className={`block truncate text-2xs ${
                          yours?.some((p) => p.code === c.player.code)
                            ? "text-accent"
                            : "text-faint"
                        }`}
                      >
                        {owner.teamName}
                      </span>
                    ) : null}
                  </span>
                  <Events c={c} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}

function ClubSide({ club, align }: { club: Club | undefined; align: "start" | "end" }) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {club ? (
        <Image
          src={crestUrl(club)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
        />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-full bg-raised" />
      )}
      <span className="truncate text-sm font-semibold">{club?.shortName ?? "—"}</span>
    </span>
  );
}

function ScoreBlock({ fixture }: { fixture: Fixture }) {
  const live = fixture.status === "live";
  const played = fixture.homeScore != null && fixture.awayScore != null;

  return (
    <span className="flex shrink-0 flex-col items-center gap-0.5">
      <span className={`numeric text-lg font-bold leading-none ${live ? "text-ink" : ""}`}>
        {played ? `${fixture.homeScore}–${fixture.awayScore}` : formatKickoff(fixture.kickoff)}
      </span>
      {/* State never rides on colour alone — the dot is always paired with a word. */}
      {live ? (
        <span className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-wide text-live">
          <span className="live-dot" />
          Live {fixture.minutes}′
        </span>
      ) : fixture.status === "finished" ? (
        <span className="text-2xs font-semibold uppercase tracking-wide text-faint">FT</span>
      ) : fixture.kickoff !== null ? (
        /* The day, in the line that says FT once the match is over — which is
           empty for precisely the fixtures that need it. A round runs Friday to
           Monday, so the list is sorted by instant and reads as scrambled: 17:30
           sits above 14:00 because one is Saturday and the other Sunday. The day
           goes here rather than into the time above it, because that slot is the
           one the score lands in and "Sun 14:00" at score size is not a score. */
        <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
          {londonDay(fixture.kickoff)}
        </span>
      ) : null}
    </span>
  );
}

/** What he did, in the app's one vocabulary for it.
 *
 *  Size and padding are this caller's; the ranking, the labels and the palette
 *  are `chipsFor`'s, and were three renderings of the same six events until they
 *  were not. Each chip still carries a letter as well as a colour, which is the
 *  AA commitment and is `chipsFor`'s to keep now. */
function Events({ c }: { c: import("@epl/core").MatchContribution }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {chipsFor(c).map((chip) => (
        <span
          key={chip.label}
          className={`numeric rounded px-1.5 py-0.5 text-2xs font-bold ${chip.className}`}
        >
          {chip.label}
        </span>
      ))}
    </span>
  );
}

/** TV picks routinely have no time yet, and an undated match must say so rather
 *  than borrow a neighbour's kickoff. */
function formatKickoff(iso: string | null): string {
  return iso === null ? "TBC" : londonTime(iso);
}
