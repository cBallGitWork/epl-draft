import Link from "next/link";
import type { ReactNode } from "react";
import Section from "../../components/shell/Section";
import { ROW_RULE, SCROLL } from "@/app/desk";
import type { MatchRow } from "./matchRows";
import { DASH } from "@epl/core";
import { matchHref } from "../../prem/match/[id]/matchRoutes";

// His season, match by match, with both accounts of every match on one line and
// the sum of them at the foot.
//
// **Championship Manager's shape**: rows of appearances, columns of statistics
// (`cm9900/11.jpg`). A figure GRID says nothing about form at all, which is what
// this replaced (Craig, 4 Sep 2026: "Grids is absolutely terrible").
//
// **The sum lives above this, not under it.** `SeasonTable` draws the Total and
// Per 90 rows as their own section (Craig, 4 Sep 2026: "Maybe we need a season
// data and match log section?"). Two sections rather than a table with a foot,
// because the season is a question a reader asks WITHOUT reading the matches —
// and because it is where the pitch maps land when they arrive.
//
// **Two provenances on one row, and the head says which is which.** Everything
// left of the rule is FPL's measurement of the play. Everything right of it is
// Fantrax's scoring of it, including `FPts` — the only per-match source of our
// league's points anywhere, because FPL's points are FPL's under FPL's rules.
//
// Fantrax's half dashes where their "Recent Games" window does not reach. That
// is not a nought: it is a match nobody showed us.
//
// Sideways rather than hidden, matching the pool table and the game log it grew
// out of: this is a scouting surface and nothing on it is dropped behind a
// breakpoint.

const dash = <span className="text-faint">—</span>;
const two = (value: number | null) =>
  value === null ? dash : value.toFixed(2);

export default function MatchLog({ rows }: { rows: readonly MatchRow[] }) {
  if (rows.length === 0) {
    // True in August for every footballer in the league, and it is a season
    // nobody has played rather than a read that failed.
    return (
      <Section title="Every match" aside="FPL's own · Fantrax's own">
        <p className="text-sm text-muted">
          No match he has played yet this season.
        </p>
      </Section>
    );
  }

  const covered = rows.filter((row) => row.paid !== null).length;

  return (
    <Section title="Every match" aside="FPL's own · Fantrax's own">
      <div className={SCROLL}>
        <table className="w-full min-w-[52rem] border-collapse text-2xs">
          <thead className="border-b border-line text-faint">
            <tr>
              <Head label="GW" align="left" />
              <Head label="Opp" align="left" />
              <Head
                label="Res"
                title="The score, from his club's point of view — tap it for the match"
              />
              <Head label="Min" title="Minutes played" />
              <Head label="G" title="Goals" />
              <Head label="A" title="Assists" />
              <Head label="CS" title="Clean sheet" />
              <Head label="Sv" title="Saves" />
              <Head label="xG" title="Expected goals" />
              <Head label="xA" title="Expected assists" />
              <Head label="Def" title="Defensive contribution" />
              <Head label="BPS" title="FPL's bonus-points score" />
              <Head label="B" title="Bonus points" />
              <Head
                label="FPL"
                title="FPL's points, under FPL's rules — not this league's"
              />
              {/* Everything from here is Fantrax's, and the rule says so. */}
              <Head
                label="FPts"
                title="This league's points for the match — Fantrax's own"
                rule
              />
              <Head
                label="S"
                title="Shots — Fantrax's own; FPL does not publish it"
              />
              <Head label="SOT" title="Shots on target — Fantrax's own" />
              <Head label="FC" title="Fouls committed — Fantrax's own" />
              <Head label="FS" title="Fouls suffered — Fantrax's own" />
              <Head label="Off" title="Offsides — Fantrax's own" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ fpl, paid }) => (
              <tr
                key={`${fpl.match.gameweek}-${fpl.match.fixtureId}`}
                className={ROW_RULE}
              >
                <td className="numeric py-1 pr-2 text-faint">
                  {fpl.match.gameweek}
                </td>
                <td className="whitespace-nowrap py-1 pr-2 font-bold">
                  {fpl.opponent?.shortName ?? DASH}
                  <span className="pl-1 text-3xs font-normal text-faint">
                    {fpl.match.home ? "H" : "A"}
                  </span>
                </td>
                <Score row={fpl} />
                <Cell value={fpl.match.minutes} />
                <Cell value={fpl.match.goals} loud={fpl.match.goals > 0} />
                <Cell value={fpl.match.assists} loud={fpl.match.assists > 0} />
                <Cell value={fpl.match.cleanSheet ? "Y" : dash} />
                <Cell value={fpl.match.saves} />
                <Cell value={two(fpl.match.expectedGoals)} />
                <Cell value={two(fpl.match.expectedAssists)} />
                <Cell value={fpl.match.defensiveContribution ?? dash} />
                <Cell value={fpl.match.bps} />
                <Cell value={fpl.match.bonus} loud={fpl.match.bonus > 0} />
                <td className="numeric px-1 text-right font-bold">
                  {fpl.match.fplPoints}
                </td>
                {/* Fantrax's half. A match outside their window is a dash on all
                    six, never a row of noughts. */}
                <td className="numeric border-l border-line px-1 text-right font-bold text-mid">
                  {paid?.points ?? dash}
                </td>
                <Cell value={paid?.shots ?? dash} />
                <Cell value={paid?.shotsOnTarget ?? dash} />
                <Cell value={paid?.foulsCommitted ?? dash} />
                <Cell value={paid?.foulsSuffered ?? dash} />
                <Cell value={paid?.offsides ?? dash} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* How far our league's half actually reaches, said out loud rather than
          left as a column of dashes a reader has to interpret. */}
      {covered < rows.length ? (
        <p className="pt-1 text-2xs text-faint">
          Fantrax&apos;s columns cover his last {covered} of {rows.length}{" "}
          matches. Their table is &ldquo;Recent Games&rdquo; and they do not
          publish how far back it goes.
        </p>
      ) : null}
    </Section>
  );
}

function Head({
  label,
  align = "right",
  title,
  rule = false,
}: {
  label: string;
  align?: "left" | "right";
  title?: string;
  rule?: boolean;
}) {
  return (
    <th
      scope="col"
      title={title}
      className={`whitespace-nowrap py-1.5 font-bold ${rule ? "border-l border-line" : ""} ${
        align === "left" ? "pr-2 text-left" : "px-1 text-right"
      }`}
    >
      {label}
    </th>
  );
}

/** A figure. Nought is drawn quiet rather than absent — FPL measured it, and a
 *  dash here would say it had not.
 *
 *  **Takes a node, not a number**, which is what let nine hand-written `<td>`s
 *  in this file collapse into it: the columns that hold a decimal, a dash or a
 *  `?? dash` were writing `numeric px-1 text-right text-muted` out again because
 *  the component would only take a `number`. */
function Cell({ value, loud = false }: { value: ReactNode; loud?: boolean }) {
  return (
    <td
      className={`numeric px-1 text-right ${loud ? "font-bold text-mid" : "text-muted"}`}
    >
      {value}
    </td>
  );
}

/** The score his way round, coloured by the result, and a way into the match.
 *
 *  The direction slot, both halves: a win is green, a loss is red, a draw quiet.
 *  This is one of the four places a result's DIRECTION is the reason for printing
 *  it at all, which is the whole test for spending those two colours. */
function Score({ row }: { row: MatchRow["fpl"] }) {
  const { match } = row;
  const result =
    match.scored > match.conceded
      ? "won"
      : match.scored < match.conceded
        ? "lost"
        : "drew";
  return (
    <td
      className={`numeric whitespace-nowrap px-1 text-right ${
        result === "lost"
          ? "text-bad"
          : result === "won"
            ? "font-bold text-up"
            : "text-muted"
      }`}
    >
      {/* **A tappable score is a CONTROL and takes the control floor**, 44 on a
          phone and 36 on the desk (DESIGN §6). It was 14px of text the moment it
          became a link and `tapfit` reported it at both widths — first at 390,
          and then at 1440 when the desk was let off with `lg:min-h-0`.
          A control never relaxes; only a row does.
          
          The cost is real and is the price of the link: one cell at 36px makes
          the whole row 36px, so this table is less dense than the appearances
          table CM draws beside it. CM's could be dense because nothing in it was
          clickable. Justified right so the figure keeps its column while the
          target grows around it. */}
      <Link
        href={matchHref(match.fixtureId, "overview")}
        className="flex min-h-11 items-center justify-end hover:underline lg:min-h-9"
      >
        <span className="sr-only">{`${result} `}</span>
        {match.scored}–{match.conceded}
      </Link>
    </td>
  );
}
