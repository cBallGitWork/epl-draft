import { FPL_SITE, clubById, fplLineup, kickedOff, oppositionByClub, playerByCode, DASH, thousands } from "@epl/core";
import type { FplPick } from "@epl/core";
import { footballNow } from "../football";
import Nothing from "../components/shell/Nothing";
import Section from "../components/shell/Section";
import PageHeader from "../components/shell/PageHeader";
import FplPitch from "./FplPitch";
import EntryForm from "./EntryForm";
import { forgetEntry } from "./actions";
import { myEntryId, mySide } from "./entry";
import type { Played } from "./played";
import { squadSubs } from "./events";
import { LABEL, PANEL, ROW_NAME, SMALL_CAPS } from "@/app/desk";
import OutLink from "../components/shell/OutLink";
import Absent from "@/app/components/shell/Absent";

// The reader's FPL side, under FPL's scoring: this week's points, the fifteen, the mini-leagues and a way out to FPL.
// A man whose club has not kicked off prints a dash, not a nought: `played.ts` asks the snapshot, not the live feed.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads this statically, so it cannot be imported.
export const revalidate = 30;

export default async function FplPage() {
  const entryId = await myEntryId();
  if (entryId === null) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title="FPL" sub="Your Fantasy Premier League side" />
        <EntryForm />
      </div>
    );
  }

  const side = await mySide();
  if (side === null) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title="FPL" />
        <section className={PANEL}>
          <Nothing title="FPL has never heard of that id" code={`entry ${entryId}`}>
            Check the number in the address bar when you look at your own points on their site.
          </Nothing>
        </section>
        <EntryForm />
      </div>
    );
  }

  const snapshot = await footballNow();
  const players = playerByCode(snapshot);
  const clubs = clubById(snapshot);
  const opposition = oppositionByClub(snapshot);
  const { entry, squad } = side;
  const arrangement = squad === null ? null : fplLineup(squad);

  // His club's fixtures this round; undefined for a man the bootstrap does not name.
  const fixturesOf = (code: number) => {
    const player = players.get(code);
    return player === undefined ? undefined : opposition.get(player.clubId);
  };

  /** Whether his club has kicked off, by the snapshot's fixture status; a live-feed row says only that the gameweek began. */
  const played: Played = (code) => kickedOff(fixturesOf(code));

  // The week's total is a dash until one of his fifteen has kicked off.
  const anyPlayed = squad?.picks.some((pick) => played(pick.code)) ?? false;
  const subs = await squadSubs(
    (squad?.picks ?? []).map((pick) => ({ code: pick.code, opposition: fixturesOf(pick.code) })),
    snapshot,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={entry.teamName || "FPL"} sub={entry.managerName} />

      {/* This week's points off `summary_event_points`, not `squad.total`, which lags the live figure. */}
      <dl className="grid grid-cols-2 gap-1.5">
        <Figure label="This week" value={anyPlayed ? entry.gameweekPoints : null} />
        <Figure label="Rank" value={entry.overallRank} />
      </dl>

      {/* The round beside the mini-leagues on a desk, so the pitch can be small and nothing is lost. */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
      {squad && arrangement ? (
        <Section
          title={`Gameweek ${squad.gameweek}`}
          aside={<>{squad.hit ? `${squad.hit} pt hit · ` : null}FPL&apos;s scoring</>}
        >
          {/* The XI on the grass and the bench as kits under it, arranged by `fplLineup`. */}
          <FplPitch
            rows={arrangement.rows}
            bench={arrangement.bench}
            players={players}
            clubs={clubs}
            opposition={opposition}
            subs={subs}
          />
          <BenchTotal picks={arrangement.bench} played={played} />
        </Section>
      ) : (
        // The heading stays, so an empty week does not read as a page that failed to render.
        <Section title={`Gameweek ${snapshot.gameweek}`} aside={<>FPL&apos;s scoring</>}>
          <p className="text-sm text-muted">
            No squad to show yet — FPL publishes a side once its first gameweek has been played.
          </p>
        </Section>
      )}

      {entry.leagues.length > 0 ? (
        <Section title="Mini-leagues">
          <ul className="cm-rows">
            {entry.leagues.map((league) => (
              <li key={league.id} className="cm-row flex min-h-11 items-center gap-2 px-1">
                <span className={`min-w-0 flex-1 truncate ${ROW_NAME}`}>
                  {league.name}
                </span>
                {/* FPL's rank, in ink: not a reading of ours (DESIGN §3). */}
                <span className="numeric shrink-0 text-sm font-bold text-ink">
                  {league.rank === null ? <Absent /> : thousands(league.rank)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      </div>

      {/* Transfers, captaincy and chips are FPL's: the way out opens the gameweek on screen. */}
      <div className="flex flex-wrap items-center gap-2">
        <OutLink
          href={`${FPL_SITE}/entry/${entryId}/event/${squad?.gameweek ?? snapshot.gameweek}`}
          className={`cm-bevel flex min-h-11 items-center px-3 lg:min-h-9 ${SMALL_CAPS}`}
        >
          Open on FPL
        </OutLink>
        {/* On a plate, since nothing prints on the bare ground; no caps, as it is pressed once. */}
        <form action={forgetEntry}>
          <button
            type="submit"
            className="cm-bevel min-h-11 px-3 text-2xs hover:brightness-110 lg:min-h-9"
          >
            Not your side? Forget it
          </button>
        </form>
      </div>
    </div>
  );
}

/** A headline number, or a dash where FPL sends null before a ball is kicked. */
function Figure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="cm-panel px-3 py-2">
      <dt className={LABEL}>{label}</dt>
      <dd className="numeric text-xl font-bold">{value === null ? DASH : thousands(value)}</dd>
    </div>
  );
}


/** What the bench left unused, the question a benched hat-trick provokes: only what has been scored. */
function BenchTotal({ picks, played }: { picks: FplPick[]; played: Played }) {
  if (picks.length === 0) return null;
  const counted = picks.filter((pick) => played(pick.code));
  const total = counted.reduce((sum, pick) => sum + pick.scored, 0);
  return (
    <p className={`flex items-baseline justify-between gap-3 pt-1 ${LABEL}`}>
      Bench
      <span className="numeric font-normal">{counted.length === 0 ? "nothing played yet" : `${total} left on it`}</span>
    </p>
  );
}
