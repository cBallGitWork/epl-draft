import Image from "next/image";
import {
  type Club,
  type Fixture,
  type FootballPlayer,
  type FootballSnapshot,
  type MatchContribution,
  type PlayerOwner,
  clubById,
  clubColoursOf,
  contributions,
  crestUrl,
  fixturesInOrder,
  londonWeekday,
  londonDayAndTime,
  londonTime,
  DASH,
} from "@epl/core";
import { chipsFor } from "../league/Chips";
import { yoursBorder } from "../../mine";
import { ROW_NAME } from "@/app/desk";
import PlayerPortrait from "./PlayerPortrait";

// The matchday list: each fixture is a native <details>, so the drop-down needs no JavaScript.

export default function MatchList({
  snapshot,
  mine,
  owners,
  now,
}: {
  snapshot: FootballSnapshot;
  /** Whether the snapshot is fresh enough to show as live: `status` carries no clock, so a stale one
   *  keeps a whistled match ticking. False still prints the scores. */
  now: boolean;
  /** The reader's players in each fixture; absent when he is signed out or holds nobody. */
  mine?: Map<number, FootballPlayer[]>;
  /** Every rostered footballer by FPL code, against the squad holding him; independent of `mine`. */
  owners?: Map<number, PlayerOwner>;
}) {
  const clubs = clubById(snapshot);
  const fixtures = fixturesInOrder(snapshot);

  if (fixtures.length === 0) {
    return (
      <p className="border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
        No fixtures scheduled for this gameweek yet.
      </p>
    );
  }

  return (
    <ul className="cm-rows flex flex-col">
      {fixtures.map((f) => (
        <li key={f.id}>
          <MatchRow
            fixture={f}
            clubs={clubs}
            snapshot={snapshot}
            yours={mine?.get(f.id)}
            owners={owners}
            now={now}
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
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  snapshot: FootballSnapshot;
  /** His players in this match, or undefined when there are none. */
  yours?: FootballPlayer[];
  owners?: Map<number, PlayerOwner>;
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const rows = contributions(snapshot, fixture.id);
  // In play, and our copy recent enough to say so; `ScoreBlock` asks the same.
  const live = now && fixture.status === "live";

  return (
    <details
      className={`group overflow-hidden ${yoursBorder(yours !== undefined)}`}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-raised [&::-webkit-details-marker]:hidden"
        aria-label={`${home?.name ?? "Home"} versus ${away?.name ?? "Away"}`}
      >
        <ClubSide club={home} align="start" />
        <ScoreBlock fixture={fixture} now={now} />
        <ClubSide club={away} align="end" />
        {/* Counted rather than tinted: a wash on every row marks no row. */}
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
        {/* All his men in the match, including those `contributions` leaves out for doing nothing. */}
        {yours ? (
          <p className="mb-2 truncate text-xs text-accent">
            <span className="font-semibold uppercase">Yours</span>
            {yours.map((p) => ` · ${p.name}`).join("")}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="py-1 text-center text-xs text-faint">
            {/* "Yet" only while the match can still change. */}
            {fixture.status === "finished"
              ? "Nothing to report."
              : live
                ? "Nothing to report yet."
                : `Kicks off ${fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff)}`}
          </p>
        ) : (
          <ul className="cm-rows flex flex-col">
            {rows.map((c) => {
              const club = clubs.get(c.clubId);
              const owner = owners?.get(c.player.code);
              return (
                <li key={c.player.id} className="flex items-center gap-2.5">
                  <PlayerPortrait player={c.player} colours={clubColoursOf(club)} />
                  <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
                    <span className={`min-w-0 truncate ${ROW_NAME}`}>{c.player.name}</span>
                    {/* Whose player he is; a footballer nobody holds says nothing rather than a dash. */}
                    {owner ? (
                      <span
                        className={`block shrink-0 truncate text-2xs ${
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
      <span className={`truncate ${ROW_NAME}`}>{club?.shortName ?? DASH}</span>
    </span>
  );
}

function ScoreBlock({ fixture, now }: { fixture: Fixture; now: boolean }) {
  const live = now && fixture.status === "live";
  const played = fixture.homeScore != null && fixture.awayScore != null;

  return (
    <span className="flex shrink-0 flex-col items-center gap-0.5">
      <span className={`numeric text-lg font-bold leading-none ${live ? "text-ink" : ""}`}>
        {played ? `${fixture.homeScore}–${fixture.awayScore}` : formatKickoff(fixture.kickoff)}
      </span>
      {/* State never rides on colour alone — the dot is always paired with a word. */}
      {live ? (
        <span className="flex items-center gap-1 text-2xs font-semibold uppercase text-live">
          <span className="live-dot" />
          Live {fixture.minutes}′
        </span>
      ) : fixture.status === "finished" ? (
        <span className="text-2xs font-semibold uppercase text-faint">FT</span>
      ) : fixture.kickoff !== null ? (
        /* The day, in FT's line: a gameweek runs Friday to Monday, so the times alone read out of order. */
        <span className="text-2xs font-semibold uppercase text-faint">
          {londonWeekday(fixture.kickoff)}
        </span>
      ) : null}
    </span>
  );
}

/** What he did, as `chipsFor`'s chips; only the size and padding are this caller's. */
function Events({ c }: { c: MatchContribution }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {chipsFor(c).map((chip) => (
        <span
          key={chip.label}
          className={`numeric px-1.5 py-0.5 text-2xs font-bold ${chip.className}`}
        >
          {chip.label}
        </span>
      ))}
    </span>
  );
}

/** An undated match says TBC rather than borrow a neighbour's kickoff. */
function formatKickoff(iso: string | null): string {
  return iso === null ? "TBC" : londonTime(iso);
}
