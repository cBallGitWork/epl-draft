import Link from "next/link";
import { LEAGUE_NAME, NOTABLE_SAVES, type Pick } from "@epl/core";
import Masthead from "./components/gazette/Masthead";
import { DEALS_SHOWN, DOUBTS_SHOWN, servedLeague } from "./config";
import { yoursBorder } from "./mine";
import Nothing from "./components/shell/Nothing";
import Section from "./components/shell/Section";
import { edition } from "./edition";
import { londonDate, londonDayAndTime } from "./londonTime";
import { getLeagueSquads } from "./squads";
import { myTeamId } from "./session";

// The Gazetta. What the league did this week, on the front page.
//
// A first edition rather than the full paper: the lead, the week's business, who
// is injured, and when lineups lock. It ships early on purpose, so it is read on
// real Saturdays while the stakes are four rehearsal teams rather than met for
// the first time on 10 Oct.
//
// Sections that have nothing to say do not appear. An edition padded out with
// "no transactions this week" is a worse paper than a shorter one.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Draft night for the league we are actually serving — the two draft nine weeks
 *  apart, so this is read from config rather than written down. */
const DRAFT_DATE = londonDate(servedLeague()?.draftDate ?? "");

/** What got him picked, in the fewest words that are still true. */
function did(pick: Pick): string {
  const notes = [
    pick.goals > 0 ? `${pick.goals}G` : null,
    pick.assists > 0 ? `${pick.assists}A` : null,
    pick.cleanSheet ? "CS" : null,
    pick.saves >= NOTABLE_SAVES ? `${pick.saves} saves` : null,
  ].filter((note): note is string => note !== null);
  return notes.length > 0 ? notes.join(" · ") : `${pick.minutes}'`;
}

export default async function GazettePage() {
  const squads = await getLeagueSquads();
  const mine = "period" in squads ? await myTeamId(squads.period.teams) : null;
  const paper = await edition(mine);
  const names = new Map(paper.teams.map((team) => [team.teamId, team.name]));
  // Nothing to print is a real state, not an empty page: our own league is in it
  // every day until draft night, and it is the first thing sixteen people will
  // open the app to.
  const blank =
    paper.eleven === null &&
    paper.deals.length === 0 &&
    paper.availability.length === 0 &&
    paper.deadline === null;
  const who = (teamId: string | null) => (teamId === null ? "the wire" : names.get(teamId) ?? "—");

  return (
    <div className="flex flex-col gap-5">
      <Masthead
        line={
          paper.live
            ? "Football is on. The scores are moving."
            : paper.deadline
              ? `Lineups lock ${londonDayAndTime(paper.deadline.at)}.`
              : `${LEAGUE_NAME}, week by week.`
        }
      />

      {paper.live ? (
        <Link
          href="/matchday"
          className="elev flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line border-l-4 border-l-live bg-surface px-3 py-2.5"
        >
          <span className="font-semibold">Your head-to-head is live</span>
          <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-live">
            <span className="live-dot" />
            Watch
          </span>
        </Link>
      ) : null}

      {blank ? (
        <Nothing title="No news yet" code={`${LEAGUE_NAME} drafts ${DRAFT_DATE}`}>
          There is nothing to report until there are squads to report on. The football is on the
          other tabs in the meantime, and it needs nobody to have drafted.
        </Nothing>
      ) : null}

      {paper.eleven ? (
        <Section title="Team of the week" aside={paper.eleven.shape}>
          <ul className="flex flex-col gap-1.5">
            {paper.eleven.picks.map((pick) => (
              <li
                key={pick.playerCode}
                className={`elev rounded-xl border bg-surface px-3 py-2.5 ${yoursBorder(
                  pick.ownerTeamId === paper.mine,
                )}`}
              >
                <p className="flex items-baseline gap-2">
                  <span className="numeric w-5 shrink-0 text-2xs text-faint">{pick.position}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{pick.playerName}</span>
                  <span className="numeric shrink-0 text-2xs text-muted">{did(pick)}</span>
                </p>
                <p className="pl-7 pt-0.5 text-2xs text-faint">
                  {pick.ownerName}
                  {/* The best story on the page: his own manager left him out. */}
                  {pick.started ? null : (
                    <span className="font-semibold text-mid"> · left him on the bench</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {paper.deals.length > 0 ? (
        <Section title="The week's business" aside={`${paper.deals.length}`}>
          <ul className="flex flex-col gap-1.5">
            {paper.deals.slice(0, DEALS_SHOWN).map((deal) => (
              <li
                key={deal.setId + deal.inbound.map((p) => p.playerName).join()}
                className="elev rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <p className="text-sm">
                  {/* A trade is two players moving in opposite directions, and
                      without these its two halves read as two unrelated signings
                      that happen to share a timestamp — the very thing grouping
                      them by `setId` was for. A claim needs no label: its second
                      half already says "out". */}
                  {deal.kind === "trade" ? (
                    <span className="text-2xs font-bold uppercase tracking-wide text-faint">
                      Trade{" "}
                    </span>
                  ) : null}
                  {deal.inbound.map((player, index) => (
                    <span key={player.playerName} className="font-semibold">
                      {index > 0 ? <span className="font-normal text-muted">· </span> : null}
                      {player.playerName}{" "}
                      <span className="font-normal text-muted">to {who(player.teamId)}</span>{" "}
                    </span>
                  ))}
                  {deal.outbound.length > 0 ? (
                    <span className="text-muted">
                      · {deal.outbound.map((player) => player.playerName).join(", ")} out
                    </span>
                  ) : null}
                </p>
                {deal.processedAt ? (
                  <p className="pt-0.5 text-2xs text-faint">{deal.processedAt}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {paper.availability.length > 0 ? (
        <Section title="Doubts" aside={`${paper.availability.length} across the league`}>
          <ul className="flex flex-col gap-1.5">
            {paper.availability.slice(0, DOUBTS_SHOWN).map((note) => (
              <li
                key={`${note.teamId}-${note.playerName}`}
                className={`elev rounded-xl border bg-surface px-3 py-2.5 ${yoursBorder(
                  note.teamId === paper.mine,
                )}`}
              >
                <p className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold">{note.playerName}</span>
                  {/* Null is not zero, and not a blank either — "FPL has not
                      said" is its own answer to a manager picking a side. */}
                  <span className="numeric shrink-0 text-2xs text-faint">
                    {note.chance === null ? "no word" : `${note.chance}%`}
                  </span>
                </p>
                <p className="pt-0.5 text-2xs text-muted">
                  {note.news ? `${note.news} · ` : null}
                  {who(note.teamId)}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {paper.deadline ? (
        <Section title="Next deadline">
          <p className="text-sm text-muted">
            Period {paper.deadline.period} opens{" "}
            <span className="numeric font-semibold text-ink">
              {londonDayAndTime(paper.deadline.at)}
            </span>
            . The commissioner locks lineups fifteen minutes before the first fixture, which is
            not a time Fantrax publishes — so this is the period boundary, not the lock itself.
          </p>
        </Section>
      ) : null}
    </div>
  );
}
