import Section from "../../components/shell/Section";
import type { GameLogRow } from "./scouting";

// His season, match by match — the thing this app held the data for and had
// never once shown.
//
// Read out of FPL's own per-player history rather than off a snapshot, because
// the four columns on the right do not exist per match anywhere else: the live
// feed publishes bps, expected goals, expected assists and defensive
// contribution only as gameweek aggregates, so on a double they describe both
// matches at once. Here they belong to the fixture.
//
// Every figure is FPL's under FPL's rules. The last column is FPL's points and
// is headed with their name for that reason — `FPts` is Fantrax's word for
// Fantrax's scoring of the slot his manager chose, and the two disagree by
// design (DESIGN §7).
//
// Sideways rather than hidden, matching the pool table: this is a scouting
// surface and nothing on it is dropped behind a breakpoint.

/** Two decimals or a dash. FPL publishes the expected-goals family as strings
 *  and has been known to omit it; a match it did not measure is not a nil. */
function decimal(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}

export default function GameLog({ rows }: { rows: GameLogRow[] }) {
  return (
    <Section title="Every match" aside="FPL's own">
      {rows.length === 0 ? (
        // True in August for every footballer in the league, and it is a season
        // nobody has played rather than a read that failed.
        <p className="text-sm text-muted">No match he has played yet this season.</p>
      ) : (
        <div
          className="overflow-x-auto"
          style={{
            marginInline: "calc(var(--page-gutter) * -1)",
            paddingInline: "var(--page-gutter)",
          }}
        >
          {/* The same width the pool's table breaks out to, so the two scroll
              alike rather than being two different tables that both happen to
              be wide. What a phone sees without scrolling is what he did; what
              is off to the right is how well. */}
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
                <Head label="GW" align="left" />
                <Head label="Opp" align="left" />
                <Head label="Res" title="The score, from his club's point of view" />
                <Head label="Min" />
                <Head label="G" title="Goals" />
                <Head label="A" title="Assists" />
                <Head label="CS" title="Clean sheet" />
                <Head label="Sv" title="Saves" />
                <Head label="Crd" title="Booked or sent off" />
                <Head label="BPS" title="FPL's bonus points system score" />
                <Head label="B" title="Bonus points, which the BPS score beside it decides" />
                <Head label="xG" title="Expected goals" />
                <Head label="xA" title="Expected assists" />
                <Head label="Def" title="FPL's defensive contribution" />
                <Head label="FPL" title="FPL's own points for this match, under FPL's rules" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ match, opponent }) => (
                <tr key={match.fixtureId} className="border-b border-line/60 hover:bg-raised">
                  <td className="numeric py-1.5 pr-2 text-left text-2xs text-faint">
                    {match.gameweek}
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-2 text-left">
                    {/* An opponent FPL names but does not list is a dash, not an
                        invented club. */}
                    <span className="numeric font-medium">{opponent?.shortName ?? "—"}</span>
                    <span className="ml-1 text-2xs text-faint">{match.home ? "H" : "A"}</span>
                  </td>
                  <Score match={match} />
                  <Cell value={match.minutes} quiet={match.minutes === 0} />
                  <Cell value={match.goals} loud={match.goals > 0} />
                  <Cell value={match.assists} loud={match.assists > 0} />
                  <td className="numeric px-1 text-right text-2xs">
                    {match.cleanSheet ? <span className="text-mid">CS</span> : dash}
                  </td>
                  <Cell value={match.saves} loud={match.saves > 0} />
                  <td className="numeric px-1 text-right text-2xs font-bold">
                    {match.redCards > 0 ? <span className="text-bad">R</span> : null}
                    {match.yellowCards > 0 ? <span className="text-mid">Y</span> : null}
                    {match.redCards === 0 && match.yellowCards === 0 ? dash : null}
                  </td>
                  <Cell value={match.bps} />
                  <Cell value={match.bonus} loud={match.bonus > 0} />
                  <td className="numeric px-1 text-right text-muted">
                    {decimal(match.expectedGoals)}
                  </td>
                  <td className="numeric px-1 text-right text-muted">
                    {decimal(match.expectedAssists)}
                  </td>
                  <td className="numeric px-1 text-right text-muted">
                    {match.defensiveContribution ?? "—"}
                  </td>
                  <td className="numeric px-1 text-right font-bold">{match.fplPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

const dash = <span className="text-faint">—</span>;

function Head({
  label,
  align = "right",
  title,
}: {
  label: string;
  align?: "left" | "right";
  title?: string;
}) {
  return (
    <th
      scope="col"
      title={title}
      className={`whitespace-nowrap py-1.5 font-bold ${
        align === "left" ? "pr-2 text-left" : "px-1 text-right"
      }`}
    >
      {label}
    </th>
  );
}

/** A figure. Nought is drawn quiet rather than absent — FPL measured it, and a
 *  dash here would say it had not. */
function Cell({ value, loud = false, quiet = false }: { value: number; loud?: boolean; quiet?: boolean }) {
  return (
    <td
      className={`numeric px-1 text-right ${
        loud ? "font-bold text-mid" : quiet ? "text-faint" : "text-muted"
      }`}
    >
      {value}
    </td>
  );
}

/** The score his way round, coloured by the result.
 *
 *  A loss takes the palette's negative slot; a win is plain ink and a draw is
 *  quiet. There is deliberately no green — the desk retired the Premier League's
 *  brand set, and `--color-up` is a token DESIGN §8 has not spent yet. */
function Score({ match }: { match: GameLogRow["match"] }) {
  const result = match.scored > match.conceded ? "won" : match.scored < match.conceded ? "lost" : "drew";
  return (
    <td
      className={`numeric whitespace-nowrap px-1 text-right ${
        result === "lost" ? "text-bad" : result === "won" ? "font-bold text-ink" : "text-muted"
      }`}
    >
      <span className="sr-only">{`${result} `}</span>
      {match.scored}–{match.conceded}
    </td>
  );
}
