import { clubById, clubColours, playerByCode } from "@epl/core";
import { footballNow } from "../football";
import Nothing from "../components/shell/Nothing";
import Section from "../components/shell/Section";
import PageHeader from "../components/shell/PageHeader";
import PlayerPortrait from "../components/football/PlayerPortrait";
import EntryForm from "./EntryForm";
import { forgetEntry } from "./actions";
import { myEntryId, mySide } from "./entry";

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

// Must match `PAGE_REVALIDATE` in core config — see the note on /matchday.
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
        <Nothing title="FPL has never heard of that id" code={`entry ${entryId}`}>
          Check the number in the address bar when you look at your own points on their site.
        </Nothing>
        <EntryForm />
      </div>
    );
  }

  const snapshot = await footballNow();
  const players = playerByCode(snapshot);
  const clubs = clubById(snapshot);
  const { entry, squad } = side;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={entry.teamName || "FPL"} sub={entry.managerName} />

      <dl className="grid grid-cols-3 gap-1.5">
        <Figure label="Overall" value={entry.overallPoints} />
        <Figure label="Rank" value={entry.overallRank} />
        <Figure label="Round" value={squad?.total ?? entry.gameweekPoints} />
      </dl>

      {squad ? (
        <Section
          title={`Gameweek ${squad.gameweek}`}
          aside={<>{squad.hit ? `${squad.hit} pt hit · ` : null}FPL&apos;s scoring</>}
        >
          <ul className="flex flex-col gap-1">
            {squad.picks.map((pick) => {
              const player = players.get(pick.code);
              const club = player ? clubs.get(player.clubId) : undefined;
              return (
                <li
                  key={pick.code}
                  className={`flex min-h-11 items-center gap-2.5 rounded-lg border border-line px-2 py-1.5 ${
                    pick.multiplier === 0 ? "opacity-60" : "bg-surface"
                  }`}
                >
                  {player && club ? (
                    <PlayerPortrait player={player} colours={clubColours(club.shortName)} />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {player?.name ?? "—"}
                    {pick.isCaptain ? (
                      <span className="ml-1.5 rounded bg-raised px-1 text-2xs font-bold text-info">C</span>
                    ) : null}
                    {pick.isViceCaptain ? (
                      <span className="ml-1.5 text-2xs text-faint">V</span>
                    ) : null}
                  </span>
                  <span className="numeric text-2xs text-faint">{club?.shortName ?? ""}</span>
                  <span className="numeric w-8 text-right font-bold">{pick.points}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : (
        <p className="text-sm text-muted">
          No squad to show yet — FPL publishes a side once its first gameweek has been played.
        </p>
      )}

      {entry.leagues.length > 0 ? (
        <Section title="Mini-leagues">
          <ul className="flex flex-col gap-1">
            {entry.leagues.map((league) => (
              <li key={league.id} className="flex min-h-11 items-center gap-3 px-1 text-sm">
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
    <div className="elev rounded-xl border border-line bg-surface px-3 py-2">
      <dt className="text-2xs font-bold uppercase tracking-widest text-faint">{label}</dt>
      <dd className="numeric text-xl font-bold">{value === null ? "—" : value.toLocaleString("en-GB")}</dd>
    </div>
  );
}
