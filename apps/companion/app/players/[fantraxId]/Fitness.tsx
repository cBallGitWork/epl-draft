import type { FootballPlayer, PlayerState } from "@epl/core";
import { availabilityOf, londonDayAndDate, DASH } from "@epl/core";
import Section from "../../components/shell/Section";
import StateBox from "../../components/football/StateBox";
import { doubtRow } from "../../components/football/doubtRow";

// Whether he can play, in FPL's own words (Craig, 26 Sep 2026: "this page should contain the
// latest player news, and their fitness conditions"): his state, his chance, and the note behind it.

const WORD: Record<PlayerState, string> = {
  fit: "Fit",
  doubt: "Doubtful",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

const ROW = "flex min-h-7 items-baseline justify-between gap-2 border-b border-bg py-0.5";

export default function Fitness({ player }: { player: FootballPlayer }) {
  const availability = availabilityOf(player);
  const fit = availability.state === "fit";
  const condition = fit ? "100%" : availability.chance === null ? DASH : `${availability.chance}%`;
  const since = fit || player.newsAdded === null ? null : londonDayAndDate(player.newsAdded);

  return (
    <Section title="Fitness" aside={since === null ? "FPL" : `FPL, ${since}`}>
      <dl className="flex flex-col">
        <div className={`${ROW} ${doubtRow(player)}`}>
          <dt className="text-sm text-ink lg:text-base">Status</dt>
          <dd className="flex items-center gap-2 text-sm font-bold text-ink lg:text-base">
            <StateBox player={player} />
            {WORD[availability.state]}
          </dd>
        </div>
        <div className={ROW}>
          <dt className="text-sm text-ink lg:text-base" title="FPL's chance of him playing the next round">
            Condition
          </dt>
          <dd className="numeric text-sm font-bold text-mid lg:text-base">{condition}</dd>
        </div>
        {availability.news === "" ? null : (
          <div className="border-b border-bg py-1">
            <dt className="sr-only">FPL&apos;s note</dt>
            <dd className="text-sm text-ink lg:text-base">{availability.news}</dd>
          </div>
        )}
      </dl>
    </Section>
  );
}
