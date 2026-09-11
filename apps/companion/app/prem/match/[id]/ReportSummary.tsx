import type { FootballPlayer, PlManMatch, PlTeamSheet } from "@epl/core";
import EventIcon from "../../../components/football/EventIcon";
import { LABEL, PANEL, ROW_NAME } from "@/app/desk";
import { sheetName } from "./match";

// What happened, before the account of how.
//
// Craig, 10 Sep 2026, on the report tab: group it *"by event, not prose"*.
// Opta's minute-by-minute is a record of a match and it is 99 lines long; a
// reader arriving after full time wants the four facts first and the account
// second. So this sits above the stream and answers "what happened" in three
// rows, and the prose underneath keeps answering "how".
//
// **Built from the fixture's own events and not by reading the sentences.**
// `plManMatches` already has all of it off the cached detail read the team sheet
// makes, so this block costs nothing — and parsing Opta's prose for a scorer
// would be name-matching at runtime, which CODE_RULES §3 forbids outright.

/** One line of the block: a man, and the minutes it happened at. */
interface Mark {
  name: string;
  minutes: number[];
}

export default function ReportSummary({
  sheets,
  events,
  byCode,
}: {
  sheets: { home: PlTeamSheet; away: PlTeamSheet } | null;
  events: Map<number, PlManMatch>;
  byCode: Map<number, FootballPlayer>;
}) {
  if (sheets === null || events.size === 0) return null;

  const named: { man: { code: number | null; name: string }; did: PlManMatch }[] = [];
  for (const sheet of [sheets.home, sheets.away]) {
    for (const man of [...sheet.lineup, ...sheet.substitutes]) {
      const did = man.code === null ? undefined : events.get(man.code);
      if (did !== undefined) named.push({ man, did });
    }
  }

  const shortName = (man: { code: number | null; name: string }) => sheetName(man, byCode);

  const goals: Mark[] = [];
  const cards: Mark[] = [];
  for (const { man, did } of named) {
    const name = shortName(man);
    // An own goal is his, and it is said in the same breath rather than filed
    // under the side that benefited — the scoresheet's own rule.
    const scored = [...did.goals, ...did.ownGoals].sort((a, b) => a - b);
    if (scored.length > 0) goals.push({ name, minutes: scored });
    const booked = [did.booked, did.sentOff].filter((at) => at !== null);
    if (booked.length > 0) cards.push({ name, minutes: booked.sort((a, b) => a - b) });
  }

  if (goals.length === 0 && cards.length === 0) return null;

  return (
    <section className={PANEL}>
      <h2 className="sr-only">What happened</h2>
      {/* **Two groups, where there were three** (Craig, 11 Sep 2026: *"can have a
          little more room for match report tab"*). The substitutions were the
          third and they were the whole problem: ten of them, each too long to
          share a line on a phone, so a SUMMARY was taking 380 of 844 pixels and
          the report it summarised began below the fold.

          Nothing is lost by taking them out. Every substitution is a row in the
          feed immediately below this box, carrying Opta's own sentence and the
          swap glyph — which is more than this said. That was true before today
          too; what changed is that the feed is now legible enough to be read
          rather than skipped, so the case for lifting its contents up here has
          gone with it.

          Goals and cards stay because they are the two a reader arriving after
          full time came for, and because there are four of each rather than ten. */}
      <dl className="flex flex-col gap-2">
        <Group glyph="ball" label="Goals" marks={goals} />
        <Group glyph="card" label="Cards" marks={cards} />
      </dl>
    </section>
  );
}

function Group({
  glyph,
  label,
  marks,
}: {
  glyph: "ball" | "card";
  label: string;
  marks: Mark[];
}) {
  if (marks.length === 0) return null;
  return (
    <div className="flex gap-2">
      <Head glyph={glyph} label={label} />
      <dd className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-0.5">
        {marks.map((mark) => (
          <span key={mark.name} className={`min-w-0 ${ROW_NAME} text-ink`}>
            {mark.name}{" "}
            <span className="numeric text-mid">
              {mark.minutes.map((at) => `${at}'`).join(" ")}
            </span>
          </span>
        ))}
      </dd>
    </div>
  );
}

/** The icon and its word, which is the pairing DESIGN's icon rule requires: a
 *  glyph alone is a rebus, and the word is what a screen reader gets. */
function Head({ glyph, label }: { glyph: "ball" | "card"; label: string }) {
  return (
    <dt className={`flex w-16 shrink-0 items-center gap-1 ${LABEL}`}>
      <EventIcon glyph={glyph} />
      {label}
    </dt>
  );
}
