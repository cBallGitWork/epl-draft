import type { CSSProperties } from "react";
import { clubIndex } from "../../../components/football/clubIndex";
import type { Club, MatchStatRow } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { GROUP_PLATE, PANEL, SMALL_CAPS } from "@/app/desk";

// Championship Manager's Match Stats board (`cm9900/22.jpg`): each side's figure on its own plate, the label between.
// A three-column grid rather than a table, because the label is the axis and the figures are its ends.

/** The rows CM prints in the card's own colour rather than in white. */
const LABEL_INK: Record<string, string> = {
  yellowCards: "text-accent",
  redCards: "text-bad",
};

/** The board under four plates (Craig, 23 Sep 2026: *"group it behind tiles better"*). */
const GROUPS = [
  { title: "Attack", keys: ["shots", "onTarget", "offTarget", "blocked", "corners"] },
  { title: "Possession", keys: ["possession", "passes", "throwIns"] },
  { title: "Defence", keys: ["tackles", "headers", "interceptions", "clearances", "saves"] },
  { title: "Discipline", keys: ["fouls", "freeKicks", "offsides", "yellowCards", "redCards"] },
];

export default function MatchStats({
  rows,
  home,
  away,
}: {
  rows: MatchStatRow[] | null;
  home: Club | undefined;
  away: Club | undefined;
}) {
  // Absent, not a board of noughts: an unplayed match has no stats (DESIGN §7).
  if (rows === null || rows.length === 0) {
    return (
      <Nothing title="No stats yet">
        Opta publishes a match&rsquo;s figures once it has been played.
      </Nothing>
    );
  }

  const byKey = new Map(rows.map((row) => [row.key, row]));
  const grouped = new Set(GROUPS.flatMap((group) => group.keys));
  // A row no group names still shows, under the last plate, rather than vanishing.
  const loose = rows.filter((row) => !grouped.has(row.key));
  const groups = GROUPS.map((group, at) => ({
    title: group.title,
    rows: [
      ...group.keys.flatMap((key) => byKey.get(key) ?? []),
      ...(at === GROUPS.length - 1 ? loose : []),
    ],
  })).filter((group) => group.rows.length > 0);

  const homeIndex = clubIndex(home);
  const awayIndex = clubIndex(away);
  return (
    // `cm-index-scoped`: each side's plates wear its club's colour, run away from their ink.
    <section className={`${PANEL} cm-index-scoped`}>
      <h2 className="sr-only">Match stats</h2>
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-x-6">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <h3 className={`${GROUP_PLATE} lg:text-xs`}>
              {group.title}
            </h3>
            {group.rows.map((row) => (
              <Row key={row.key} row={row} home={homeIndex} away={awayIndex} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Row({ row, home, away }: { row: MatchStatRow; home: CSSProperties; away: CSSProperties }) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-2">
      <Figure value={row.home} percent={row.percent} colour={home} />
      <span
        className={`text-center ${SMALL_CAPS} lg:text-sm ${
          LABEL_INK[row.key] ?? "text-ink"
        }`}
      >
        {row.label}
      </span>
      <Figure value={row.away} percent={row.percent} colour={away} />
    </div>
  );
}

function Figure({ value, percent, colour }: { value: number; percent: boolean; colour: CSSProperties }) {
  return (
    <span
      style={colour}
      className="cm-index numeric flex h-6 items-center justify-center text-sm font-bold lg:h-7 lg:text-base"
    >
      {value}
      {percent ? "%" : ""}
    </span>
  );
}
