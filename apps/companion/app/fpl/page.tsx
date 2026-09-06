import { clubById, fplLineup, kickedOff, oppositionByClub, playerByCode } from "@epl/core";
import type { FplPick } from "@epl/core";
import { footballNow } from "../football";
import Nothing from "../components/shell/Nothing";
import Section from "../components/shell/Section";
import PageHeader from "../components/shell/PageHeader";
import FplPitch from "./FplPitch";
import EntryForm from "./EntryForm";
import { forgetEntry } from "./actions";
import { myEntryId, mySide } from "./entry";
import { FPL_SITE, type Played } from "./played";
import { LABEL, PANEL, ROW_NAME, SMALL_CAPS } from "@/app/desk";

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
//
// **The relic pass** (Craig, 5 Sep 2026: *"Its a relic, needs to use CM UI for
// all data on this pitch, rows, titles, pitch etc, forwards at top etc. and a
// link to the proper fpl page. and it needs a bench. round always showing as
// zero, and players as zero when not played a game yet"*). Four of those five
// are answered here and the fifth is `PitchRows`:
//
// **A nought is not an absence, and this page printed nought for both.** A man
// whose club has not kicked off has not scored nothing — there is no number yet,
// and DESIGN §7 has one mark for that. It came from `mapSquad` being handed
// `live.get(element) ?? 0`, and the fallback is right where FPL omits a man from
// a round it IS scoring; it is wrong before a ball is kicked. So the CLOCK
// decides, not the payload: `played.ts` asks the football snapshot whether his
// club's fixture has started. The round total takes the same rule for the same
// reason — "Round 0" on a Friday is a claim about a round nobody has played.
//
// **The bench was there and was not a bench.** Four bordered cards on their own
// grounds, in a register whose rows sit straight on the ground with a rule
// between them. It is `.cm-rows` now, with CM's blue index block carrying the
// order they come on in — which is the one thing that ordering means, and
// exactly what an index block is for.
//
// **A way out to FPL's own page**, which a tab about somebody else's game should
// always have had: this shows a side and cannot change one.

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
  const opposition = oppositionByClub(snapshot);
  const { entry, squad } = side;
  const arrangement = squad === null ? null : fplLineup(squad);

  /** Whether this man's club has kicked off in the round on screen.
   *
   *  The football snapshot's own `status`, which is FPL's statement about its
   *  own fixtures — not a clock of ours and not the presence of a row in the
   *  live feed. CLAUDE.md counts that feed at 600 rows once a round starts, 569
   *  of them on no minutes, so a row says the ROUND has started and never that
   *  the MAN has appeared. */
  const played: Played = (code) => {
    const player = players.get(code);
    return player === undefined ? false : kickedOff(opposition.get(player.clubId));
  };

  // Any of his men kicked off is the round having started for HIM, which is what
  // a round total is about. A blank week — every one of his fifteen idle — is the
  // one case where nought and "nothing yet" genuinely differ.
  const anyPlayed = squad?.picks.some((pick) => played(pick.code)) ?? false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={entry.teamName || "FPL"} sub={entry.managerName} />

      {/* **Two figures, and the first is this WEEK's** (Craig, 5 Sep 2026:
          "remove overall points score, just use weekly", "round - 0 still, just
          remove that box").
          The Round box was the reason: it preferred `squad.total` over
          `entry.gameweekPoints`, and `squad.total` is FPL's own stored round
          total, which lags its live one — measured at 19:44 on 5 Sep it printed
          3 while the eleven on the grass that minute summed to 27. A figure
          contradicted by the pitch six pixels under it is worse than no figure.
          So the box goes and the WEEKLY number takes the first slot, off
          `summary_event_points`, which is the same read the rank comes from.

          The season total goes with it: this tab answers "how did I do this
          week", and the pitch below it is a week. A running total belongs on a
          screen about a season and there is not one. */}
      <dl className="grid grid-cols-2 gap-1.5">
        <Figure label="This week" value={anyPlayed ? entry.gameweekPoints : null} />
        <Figure label="Rank" value={entry.overallRank} />
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
          <FplPitch
            rows={arrangement.rows}
            players={players}
            clubs={clubs}
            opposition={opposition}
          />
          <Bench picks={arrangement.bench} players={players} clubs={clubs} played={played} />
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
          <ul className="cm-rows">
            {entry.leagues.map((league) => (
              <li key={league.id} className="cm-row flex min-h-11 items-center gap-2 px-1">
                <span className={`min-w-0 flex-1 truncate ${ROW_NAME}`}>
                  {league.name}
                </span>
                {/* CYAN, and the slot agrees: a rank is a reading DERIVED from
                    everybody's totals rather than a fact anybody recorded, which
                    is what `--color-info` means (DESIGN §3). */}
                <span className="numeric shrink-0 text-sm font-bold text-info">
                  {league.rank === null ? <span className="text-faint">&mdash;</span> : league.rank.toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* **Their game, their page.** This tab shows a side and can never change
          one: transfers, captaincy and chips are all on FPL's own site, and a
          screen that reads somebody else's game without saying where to act on
          it is a dead end. On the round the page is about, so the two agree. */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`${FPL_SITE}/entry/${entryId}/event/${squad?.gameweek ?? snapshot.gameweek}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`cm-bevel flex min-h-11 items-center px-3 lg:min-h-9 ${SMALL_CAPS}`}
        >
          Open on FPL ↗
        </a>
        {/* On a plate too, and for the same reason as the link beside it: a
            control on the bare photograph is DESIGN §2's one prohibition, and
            `groundfit` had this button open. Quieter than the way OUT — this is
            the thing you press once — so it takes the plate without the caps. */}
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

/** The four who did not start, under a heading that totals them. "Did my bench
 *  outscore my side" is the question a benched hat-trick provokes, and it is the
 *  one sum on this page worth doing for a reader — it is about picks he made,
 *  not about what FPL scored him, which stays FPL's.
 *
 *  CM's rows, not four bordered cards: the reference puts a list straight on the
 *  ground with a rule between the rows and one repeating fill, the blue index
 *  block down the left. Here the block carries the order they would come on in,
 *  which is the one thing FPL's bench ordering means and exactly the kind of
 *  fact an index block is for. */
function Bench({
  picks,
  players,
  clubs,
  played,
}: {
  picks: FplPick[];
  players: Players;
  clubs: Clubs;
  played: Played;
}) {
  if (picks.length === 0) return null;
  // Only what has actually been scored. A bench of four idle men "left nought
  // on it", which is a sentence about a round nobody has played.
  const counted = picks.filter((pick) => played(pick.code));
  const total = counted.reduce((sum, pick) => sum + pick.points, 0);

  return (
    <div className="flex flex-col gap-1 pt-2">
      <h3 className={`flex items-baseline justify-between gap-3 border-t border-line pt-2 ${LABEL}`}>
        Bench
        <span className="numeric font-normal">
          {counted.length === 0 ? "nothing played yet" : `${total} left on it`}
        </span>
      </h3>
      <ul className="cm-rows">
        {picks.map((pick, at) => {
          const player = players.get(pick.code);
          const club = player ? clubs.get(player.clubId) : undefined;
          return (
            <li key={pick.code} className="cm-row flex min-h-11 items-stretch gap-2">
              <span className="cm-index numeric flex w-7 shrink-0 items-center justify-center text-2xs font-bold">
                {at + 1}
              </span>
              <span className={`flex min-w-0 flex-1 items-center truncate text-ink ${ROW_NAME}`}>
                {player?.name ?? "—"}
              </span>
              <span className={`flex shrink-0 items-center ${SMALL_CAPS} text-muted`}>
                {club?.shortName ?? ""}
              </span>
              <span className="numeric flex w-8 shrink-0 items-center justify-end text-sm font-bold text-info">
                {played(pick.code) ? pick.points : <span className="text-faint">&mdash;</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
