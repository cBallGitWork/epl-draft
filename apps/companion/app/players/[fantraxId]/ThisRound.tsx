import Section from "../../components/shell/Section";
import type { RoundSoFar } from "./scouting";

// What he has done in the round on screen, live.
//
// Every figure is FPL's own measurement of a real footballer, which is what the
// heading says. None of it is scored — not by FPL, not by Fantrax and not by us
// — so nothing here belongs in a column headed FPts, and the block below this
// one that IS Fantrax's says so in its own heading.
//
// The four on the right are the ones this app has been mapping and throwing away
// since the football layer was written: bonus points, expected goals, expected
// assists and FPL's defensive contribution.

/** One measurement. `null` is the absence of one and prints as a dash — never as
 *  a nought, which is a different claim and the one this app refuses to make
 *  (DESIGN §7). */
function Figure({ label, value, title }: { label: string; value: string | null; title?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-surface px-1 py-1.5">
      <span
        className="text-2xs uppercase tracking-widest text-faint"
        title={title}
      >
        {label}
      </span>
      <span className={`numeric text-sm font-bold ${value === null ? "text-faint" : "text-mid"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function ThisRound({ round }: { round: RoundSoFar | null }) {
  // Nothing before the first kickoff of the round, and nothing when FPL's live
  // feed could not be read. They are opposite situations and a row of noughts
  // would state both of them as fact.
  if (round === null) return null;

  const { done } = round;
  const measured = done.measured;
  const decimal = (n: number) => n.toFixed(2);

  return (
    <Section title={`Gameweek ${round.gameweek} so far`} aside="FPL's own">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
        <Figure label="Min" value={String(done.minutes)} />
        <Figure label="G" value={String(done.goals)} title="Goals" />
        <Figure label="A" value={String(done.assists)} title="Assists" />
        <Figure
          label="BPS"
          value={measured === null ? null : String(measured.bps)}
          title="FPL's bonus points system score — a neutral read on who played well"
        />
        <Figure
          label="xG"
          value={measured === null ? null : decimal(measured.expectedGoals)}
          title="Expected goals, from the chances he had"
        />
        <Figure
          label="xA"
          value={measured === null ? null : decimal(measured.expectedAssists)}
          title="Expected assists, from the chances he made"
        />
        <Figure
          label="Def"
          value={measured === null ? null : String(measured.defensiveContribution)}
          title="FPL's defensive contribution: tackles, interceptions, clearances, blocks and recoveries"
        />
      </div>

      {/* The things that either happened or did not. A nought here is noise on
          every player in the league every week, so a cell appears only once
          there is something to put in it. */}
      <div className="flex flex-wrap gap-1">
        {done.cleanSheet ? <Event label="Clean sheet" /> : null}
        {done.saves > 0 ? <Event label={`${done.saves} saves`} /> : null}
        {done.penaltiesSaved > 0 ? <Event label={`${done.penaltiesSaved} pen saved`} /> : null}
        {done.penaltiesMissed > 0 ? (
          <Event label={`${done.penaltiesMissed} pen missed`} bad />
        ) : null}
        {done.yellowCards > 0 ? <Event label={`${done.yellowCards} booked`} /> : null}
        {done.redCards > 0 ? <Event label="Sent off" bad /> : null}
      </div>
    </Section>
  );
}

/** A thing that happened, in words. Red is the palette's "a negative" slot and
 *  the word says it too, because a colour on its own is not a message. */
function Event({ label, bad = false }: { label: string; bad?: boolean }) {
  return (
    <span
      className={` bg-surface px-2 py-1 text-2xs font-semibold ${
 bad ?"text-bad":"text-muted"
}`}
    >
      {label}
    </span>
  );
}
