import Section from "../../components/shell/Section";
import { FACT } from "@/app/desk";
import { LEAGUE_TIMEZONE } from "@epl/core";

// When he signed for the club he is at — Championship Manager's `Contract` tab,
// which is one row here rather than a fifth plate.
//
// **It is a stand-in and says so.** What this tab really wants is Fantrax's own
// `TEAM_SERVICE_TIME`, which their payload names in its `sections` list and will
// not hand over: `section`, `sectionCode`, `view` and
// `displayedSelections.sectionCode` were each tried on 4 Sep 2026 and each
// ignored. FPL's `team_join_date` is the one fact about a footballer's
// employment we can actually read, on 633 of 652.

const JOINED = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: LEAGUE_TIMEZONE,
});

export default function Joined({ date }: { date: string | null }) {
  // No heading over an absence. FPL leaves it null on nineteen in six hundred,
  // and a "Joined —" row is a claim that something failed to load.
  if (date === null) return null;
  const when = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(when.getTime())) return null;
  return (
    <Section title="At this club" aside="FPL's own">
      <div className={FACT}>
        <span className="min-w-0 flex-1 text-sm text-muted">Joined</span>
        <span className="numeric font-bold">{JOINED.format(when)}</span>
      </div>
    </Section>
  );
}
