import Image from "next/image";
import {
  type Club,
  type Fixture,
  type FootballSnapshot,
  clubById,
  clubColours,
  contributions,
  crestUrl,
  fixturesInOrder,
} from "@epl/core";
import { londonTime } from "../../londonTime";
import PlayerPortrait from "./PlayerPortrait";

// The matchday list. Each fixture is a native <details> so the drop-down works
// with no JavaScript, is keyboard operable and screen-reader announced for free —
// reinventing a disclosure widget here would be the product-register mistake.

export default function MatchList({ snapshot }: { snapshot: FootballSnapshot }) {
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
          <MatchRow fixture={f} clubs={clubs} snapshot={snapshot} />
        </li>
      ))}
    </ul>
  );
}

function MatchRow({
  fixture,
  clubs,
  snapshot,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  snapshot: FootballSnapshot;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const rows = contributions(snapshot, fixture.id);
  const live = fixture.status === "live";

  return (
    <details className="group overflow-hidden rounded-xl border border-line bg-surface elev">
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-raised [&::-webkit-details-marker]:hidden"
        // Nothing to expand when nothing happened — say so rather than opening
        // onto an empty panel.
        aria-label={`${home?.name ?? "Home"} versus ${away?.name ?? "Away"}`}
      >
        <ClubSide club={home} align="start" />
        <ScoreBlock fixture={fixture} />
        <ClubSide club={away} align="end" />
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
        {rows.length === 0 ? (
          <p className="py-1 text-center text-xs text-faint">
            {live || fixture.status === "finished"
              ? "Nothing to report yet."
              : `Kicks off ${formatKickoff(fixture.kickoff)}`}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((c) => {
              const club = clubs.get(c.clubId);
              return (
                <li key={c.player.id} className="flex items-center gap-2.5">
                  <PlayerPortrait player={c.player} colours={clubColours(club?.shortName ?? "")} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.player.name}
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
      ) : null}
    </span>
  );
}

/** Compact event chips. Each carries a letter as well as a colour so the meaning
 *  survives without hue — required by our AA commitment. */
function Events({ c }: { c: import("@epl/core").MatchContribution }) {
  const chips: { label: string; count: number; className: string }[] = [
    { label: "G", count: c.goals, className: "bg-accent text-bg" },
    { label: "A", count: c.assists, className: "bg-info text-bg" },
    { label: "S", count: c.saves >= 4 ? c.saves : 0, className: "bg-raised text-muted" },
    { label: "B", count: c.bonus, className: "bg-raised text-muted" },
    { label: "YC", count: c.yellowCards, className: "bg-mid text-bg" },
    { label: "RC", count: c.redCards, className: "bg-bad text-ink" },
  ].filter((chip) => chip.count > 0);

  return (
    <span className="flex shrink-0 items-center gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={`numeric rounded px-1.5 py-0.5 text-2xs font-bold ${chip.className}`}
        >
          {chip.count > 1 ? `${chip.count}${chip.label}` : chip.label}
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
