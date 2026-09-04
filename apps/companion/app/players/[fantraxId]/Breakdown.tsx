import { signed } from "@epl/core";
import Section from "../../components/shell/Section";
import type { PlayerSeason } from "./season";

// The first view in this app that explains a number rather than printing one.
//
// Every value here is Fantrax's, under our league's own scoring, and the parts
// add up to the whole exactly — which is the reason we read their breakdown
// instead of computing one. Our engine would have had to approximate five
// categories FPL does not publish, and then say so under every total.

export default function Breakdown({ season }: { season: PlayerSeason | null }) {
  // Nothing to say for a free agent: this comes from a team's own table, and a
  // player on no team has no row. Saying so would be a heading over an absence.
  //
  // A player with a row and no categories is a different answer and is kept: in
  // August that is every footballer in the league, and "0, nothing yet" is the
  // true state of a season nobody has played. Dropping it would make an empty
  // card look like a broken one.
  if (season === null) return null;

  // What the numbers are, from what Fantrax answered rather than what we asked
  // for — it has been known to hand back a projection either way.
  //
  // **The heading names the league, and that is not decoration.** This block now
  // sits under two tables headed "FPL's own" — his match log and his previous
  // seasons — and every figure in it is Fantrax's, under this commissioner's
  // scoring. `FPts` in the aside is Fantrax's exclusive word and says so to a
  // reader who already knows; the heading has to say it to one who does not
  // (DESIGN §7, provenance at the point of use).
  const heading = season.season.projected
    ? "Fantrax projects"
    : `In this league · ${season.season.name || "this season"}`;

  return (
    <Section
      title={heading}
      aside={
        <span className="numeric text-sm font-bold text-ink">
          {season.points ?? "—"}
          <span className="ml-1 text-2xs font-normal text-faint">
            FPts{season.perGame === null ? "" : ` · ${season.perGame} a game`}
          </span>
        </span>
      }
    >
      {season.categories.length === 0 ? (
        <p className="text-sm text-muted">Nothing on his record yet.</p>
      ) : null}

      <ul className="flex flex-col gap-0.5">
        {season.categories.map((category) => (
          <li
            key={category.code}
            className="flex min-h-9 items-center gap-2.5 bg-surface px-3 py-1.5"
          >
            {/* Fantrax's own definition sits behind the label — it is where they
                publish the rules a manager would otherwise have to guess, like
                what counts as a clean sheet. Their sentence, not ours. */}
            <span
              className="min-w-0 flex-1 truncate text-sm text-muted"
              title={category.definition ?? undefined}
            >
              {category.name}
            </span>
            <span
              className={`numeric text-sm font-bold ${
                category.points < 0 ? "text-bad" : "text-ink"
              }`}
            >
              {signed(category.points)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
