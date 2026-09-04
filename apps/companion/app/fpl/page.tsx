import { clubById, clubColours, fplLineup, playerByCode } from "@epl/core";
import type { FplPick } from "@epl/core";
import { footballNow } from "../football";
import Nothing from "../components/shell/Nothing";
import Section from "../components/shell/Section";
import PageHeader from "../components/shell/PageHeader";
import PlayerPortrait from "../components/football/PlayerPortrait";
import FplPitch from "./FplPitch";
import EntryForm from "./EntryForm";
import { forgetEntry } from "./actions";
import { myEntryId, mySide } from "./entry";
import { LABEL, PANEL, QUIET_FIGURE } from "@/app/desk";

// The other game, kept small on purpose.
//
// Most of our league also runs an FPL side at weekends, and this is that one
// tab: your points, your fifteen, your mini-leagues. No history, no
// projections — the football layer already models the real competition properly
// and this is not a second attempt at it.
//
// Every number here is FPL's, under FPL's scoring, and the page says so. The
// same footballer is worth different amounts in the two games, and a reader on
// an adjacent tab has to be told which game they are looking at.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
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
  const { entry, squad } = side;
  const arrangement = squad === null ? null : fplLineup(squad);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={entry.teamName || "FPL"} sub={entry.managerName} />

      <dl className="grid grid-cols-3 gap-1.5">
        <Figure label="Overall" value={entry.overallPoints} />
        <Figure label="Rank" value={entry.overallRank} />
        <Figure label="Round" value={squad?.total ?? entry.gameweekPoints} />
      </dl>

      {squad && arrangement ? (
        <Section
          title={`Gameweek ${squad.gameweek}`}
          aside={<>{squad.hit ? `${squad.hit} pt hit · ` : null}FPL&apos;s scoring</>}
        >
          {/* The XI on the grass, the bench as rows under it — the same shape a
              rival's team sheet takes, so the two games read alike even though
              none of their numbers may be compared.

              The pitch waited on this adapter carrying `element_type`: a pitch
              needs lines, and the football layer refuses to know what line a man
              is in because Fantrax files several of them differently. FPL's own
              classification belongs to FPL's own layer, which is where it now
              lives. The arrangement is `fplLineup`, pure and tested in core.

              The bench stays a list. It is four men in the order they would come
              on, which is an ordering rather than a shape, and standing them on
              grass would claim a formation nobody picked. */}
          <FplPitch rows={arrangement.rows} players={players} clubs={clubs} />
          <Bench picks={arrangement.bench} players={players} clubs={clubs} />
        </Section>
      ) : (
        // Keeps the section rather than dropping to a bare sentence between the
        // figures and the mini-leagues: the heading is what tells a reader this
        // is the round's squad and it is empty, and without it the page reads as
        // one that failed to finish rendering.
        <Section title={`Gameweek ${snapshot.gameweek}`} aside={<>FPL&apos;s scoring</>}>
          <p className="text-sm text-muted">
            No squad to show yet — FPL publishes a side once its first gameweek has been played.
          </p>
        </Section>
      )}

      {entry.leagues.length > 0 ? (
        <Section title="Mini-leagues">
          <ul className="flex flex-col gap-1">
            {entry.leagues.map((league) => (
              <li key={league.id} className="cm-row flex min-h-11 items-center gap-3 px-1 text-sm">
                <span className="min-w-0 flex-1 truncate">{league.name}</span>
                <span className="numeric text-muted">{league.rank ?? "—"}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <form action={forgetEntry}>
        <button type="submit" className="min-h-11 px-1 text-2xs text-faint hover:text-muted">
          Not your side? Forget it
        </button>
      </form>
    </div>
  );
}

/** A headline number, or an honest dash. FPL sends null before a ball is kicked
 *  and nought would be a different claim. */
function Figure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="cm-panel px-3 py-2">
      <dt className={LABEL}>{label}</dt>
      <dd className="numeric text-xl font-bold">{value === null ? "—" : value.toLocaleString("en-GB")}</dd>
    </div>
  );
}

type Players = ReturnType<typeof playerByCode>;
type Clubs = ReturnType<typeof clubById>;

function Picks({
  picks,
  players,
  clubs,
}: {
  picks: FplPick[];
  players: Players;
  clubs: Clubs;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {picks.map((pick) => {
        const player = players.get(pick.code);
        const club = player ? clubs.get(player.clubId) : undefined;
        return (
          <li
            key={pick.code}
            className={`flex min-h-11 items-center gap-2.5 border border-line px-2 py-1.5 ${
 pick.multiplier === 0 ?"opacity-60":"bg-surface"
}`}
          >
            {player && club ? (
              <PlayerPortrait player={player} colours={clubColours(club.shortName)} />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {player?.name ?? "—"}
              {pick.isCaptain ? (
                <span className="ml-1.5 bg-raised px-1 text-2xs font-bold text-info">C</span>
              ) : null}
              {pick.isViceCaptain ? <span className="ml-1.5 text-2xs text-faint">V</span> : null}
            </span>
            <span className={QUIET_FIGURE}>{club?.shortName ?? ""}</span>
            <span className="numeric w-8 text-right font-bold">{pick.points}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** The four who did not start, under a heading that totals them. "Did my bench
 *  outscore my side" is the question a benched hat-trick provokes, and it is the
 *  one sum on this page worth doing for a reader — it is about picks he made,
 *  not about what FPL scored him, which stays FPL's. */
function Bench({ picks, players, clubs }: { picks: FplPick[]; players: Players; clubs: Clubs }) {
  if (picks.length === 0) return null;
  const total = picks.reduce((sum, pick) => sum + pick.points, 0);

  return (
    <div className="flex flex-col gap-1 pt-2">
      <h3 className={`flex items-baseline justify-between gap-3 border-t border-line pt-2 ${LABEL}`}>
        Bench
        <span className="numeric font-normal">{total} left on it</span>
      </h3>
      <Picks picks={picks} players={players} clubs={clubs} />
    </div>
  );
}
