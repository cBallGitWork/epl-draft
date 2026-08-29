import { Suspense } from "react";
import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerProfile, mapPlayerProfile } from "@epl/core";
import type { LabelledValue, PlayerIntel } from "@epl/core";
import ButtonLink from "../../components/shell/ButtonLink";
import Nothing from "../../components/shell/Nothing";
import Skeleton from "../../components/shell/Skeleton";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";
import Availability from "./Availability";
import Breakdown from "./Breakdown";
import Pedigree from "./Pedigree";
import Projection from "./Projection";
import FixtureRun from "./FixtureRun";
import GameLog from "./GameLog";
import Portrait from "./Portrait";
import ThisRound from "./ThisRound";
import { footballSelf, playerSeason } from "./season";
import { fantraxProjection, playerPedigree } from "./draft";
import { gameLog, scouting } from "./scouting";
import type { FootballPlayer } from "@epl/core";
import { positionsFromList } from "../../positions";

// One player, as Fantrax sees him. Reached by tapping a name in the pool, and
// that is the whole politeness policy: one profile per tap, never a sweep of the
// 697.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** A player id that is not a player and a Fantrax that is not answering arrive as
 *  the same refusal, so this does not pretend to tell them apart with a 404. The
 *  tell goes on screen instead, which is what makes a mistyped URL diagnosable
 *  rather than mysterious. */
async function profile(fantraxId: string): Promise<PlayerIntel | Unavailable> {
  const raw = await orRefusal(fetchPlayerProfile(FANTRAX_LEAGUE_ID, fantraxId));
  return raw instanceof FantraxError ? { unavailable: tell(raw) } : mapPlayerProfile(raw);
}

/** One block of name-and-value rows. Renders nothing when the block is empty —
 *  a heading over no rows is a claim that something is missing. */
function Facts({ title, note, rows }: { title: string; note?: string; rows: LabelledValue[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
        {title}
      </h2>
      {note ? <p className="text-2xs text-faint">{note}</p> : null}
      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2"
          >
            {/* Fantrax's short label, with their own longer wording behind it.
                The long form is a full sentence on some rows and would wrap to
                three lines on a phone. */}
            <dt className="min-w-0 flex-1 truncate text-sm text-muted" title={row.description ?? undefined}>
              {row.label}
            </dt>
            <dd className="numeric font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const intel = await profile(fantraxId);

  if ("unavailable" in intel) {
    return (
      <Nothing title="No profile for that player" code={intel.unavailable}>
        Either Fantrax does not know that id or it is not answering. Both come back the same way,
        so this does not guess which.
      </Nothing>
    );
  }

  // An extra on a page that already has something to say, so it is fetched after
  // the profile has succeeded and cannot fail it. It reads the snapshot every
  // other screen keeps warm, which is why the heading does not wait behind a
  // boundary for it — his season does, below.
  const football = await footballSelf(fantraxId);

  // His round and his run to come. Both read the snapshot and the season
  // calendar every other screen already holds, so they cost FPL nothing and do
  // not go behind a boundary — his game log, which is a request of its own,
  // does. Null for a man the bridge has never settled: there is no footballer to
  // scout, which is the same permanent state the portrait is absent for.
  const scout = football === null ? null : await scouting(football.player);

  return (
    <div className="flex flex-col gap-3">
      {/* No portrait for a man FPL has never listed, and nothing standing in for
          one: he has no code, so there is no photograph, no kit and no crest to
          draw. That is 120 of the 688 in the pool and it is a settled answer,
          not a gap — the heading below carries him on its own, exactly as it
          did for every player before this. */}
      <header className="flex items-end gap-3 pt-1">
        {football ? (
          <Portrait
            player={football.player}
            club={football.club}
            position={intel.defaultPosition}
            squadNumber={intel.squadNumber}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
          <h1 className="text-xl font-bold tracking-tight">{intel.name || fantraxId}</h1>
          <p className="numeric text-2xs tracking-widest text-faint">
            {[
              intel.clubShortName,
              positionsFromList(intel.defaultPosition),
              intel.squadNumber && `#${intel.squadNumber}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </header>

      <Availability player={football?.player ?? null} />

      {/* The football layer's account of him, which this app has held the data
          for since it was written and had never shown: what he has done in the
          round on screen, what is coming, and every match of his season with
          the four measurements a live snapshot cannot give per fixture. */}
      {scout === null ? null : (
        <>
          <ThisRound round={scout.round} />
          <FixtureRun run={scout.run} />
        </>
      )}
      {/* Fantrax's own guess at his round, which is a different claim from every
          FPL measurement above it and says so in its own heading. Streamed
          because it reads the league's rosters and the live payload, and gated
          inside that read: their projection covers the fielded eleven only, so
          the number appearing at all would state a lineup. */}
      <Suspense fallback={null}>
        <Projected fantraxId={fantraxId} ownerTeamId={intel.ownerTeamId} />
      </Suspense>

      {football === null ? null : (
        <Suspense fallback={<LogWaiting />}>
          <Log player={football.player} />
        </Suspense>
      )}

      {/* What the draft paid for him, streamed for the same reason his season is:
          the ranking behind "four picks better than he cost" is every drafted
          man's, which is the pool table — the largest read in the app. The
          fallback is nothing at all, because a league whose draft has not run
          prints nothing here and a shape reserved for it would be a promise the
          page cannot keep. */}
      <Suspense fallback={null}>
        <Draft fantraxId={fantraxId} />
      </Suspense>

      {/* His season streams under the heading. `playerSeason` reads the owning
          team's whole stats table — a Fantrax request of its own, and the
          slowest thing on this page — while everything above is already in hand
          from the profile.

          Only for a player somebody owns, and that is not a guard bolted on: the
          read answers null for a free agent without asking Fantrax anything, so
          a boundary there would put a card on screen that could only ever come
          back empty. */}
      {intel.ownerTeamId === null ? null : (
        <Suspense fallback={<SeasonWaiting />}>
          <Season fantraxId={fantraxId} ownerTeamId={intel.ownerTeamId} />
        </Suspense>
      )}

      {/* The season is named here for the same reason it is named above it: this
          block and the one this page opens with both print an FPts, and until
          the label went on they were 196 and 0 with nothing to say why. These
          are the profile's numbers, and the profile answers about a projection
          unless told otherwise. */}
      <Facts
        title={intel.season ? `In this league · ${intel.season}` : "In this league"}
        rows={intel.league}
      />

      <Facts
        title={intel.season ? `Fantrax · ${intel.season}` : "Fantrax"}
        note={
          intel.season
            ? undefined
            : "Fantrax did not say which season these describe, so read them with care."
        }
        rows={intel.highlights}
      />

      {/* The one block on this page that is not about our competition, said in
          the heading rather than in a footnote: these percentages are every
          league on Fantrax, and they sit two rows below ours. */}
      <Facts title="Across every Fantrax league" rows={intel.market} />

      <Facts title="Player" rows={intel.personal} />

      <div className="flex flex-col gap-1.5">
        {intel.ownerTeamId ? (
          <ButtonLink href={`/squad/${intel.ownerTeamId}`}>The squad he is in</ButtonLink>
        ) : null}
        <ButtonLink href="/players">Every player</ButtonLink>
      </div>
    </div>
  );
}

/** His season in our league, read behind the boundary above. Nothing but the
 *  await lives here — the card itself is `Breakdown`, unchanged. */
async function Season({ fantraxId, ownerTeamId }: { fantraxId: string; ownerTeamId: string }) {
  return <Breakdown season={await playerSeason(fantraxId, ownerTeamId)} />;
}

/** Fantrax's guess at his round, read behind the boundary above. */
async function Projected({
  fantraxId,
  ownerTeamId,
}: {
  fantraxId: string;
  ownerTeamId: string | null;
}) {
  return <Projection projection={await fantraxProjection(fantraxId, ownerTeamId)} />;
}

/** Where he was taken and what he has repaid, read behind the boundary above. */
async function Draft({ fantraxId }: { fantraxId: string }) {
  const { pedigree, drafterName } = await playerPedigree(fantraxId);
  return <Pedigree pedigree={pedigree} drafterName={drafterName} />;
}

/** His match-by-match season, read behind the boundary above. The only request
 *  on this page FPL has not already answered for somebody else. */
async function Log({ player }: { player: FootballPlayer }) {
  return <GameLog rows={await gameLog(player)} />;
}

/** The log's own shape while that read is in flight: a ruled head, then rows the
 *  height the table's are. */
function LogWaiting() {
  return (
    <section aria-busy className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        <Skeleton width="6rem" height="0.75rem" />
        <Skeleton width="4rem" height="0.75rem" />
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex min-h-7 items-center gap-3">
            <Skeleton width="2rem" height="0.875rem" />
            <Skeleton width="100%" height="0.875rem" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The breakdown's own shape while that read is in flight: a ruled head with the
 *  total on the right, then the categories that earned it. */
function SeasonWaiting() {
  return (
    <section aria-busy className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        <Skeleton width="7rem" height="0.75rem" />
        <Skeleton width="4.5rem" height="0.875rem" />
      </div>
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex min-h-9 items-center rounded-lg bg-surface px-3">
            <Skeleton width="40%" height="0.875rem" />
          </div>
        ))}
      </div>
    </section>
  );
}
