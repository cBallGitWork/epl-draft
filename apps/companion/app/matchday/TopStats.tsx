import Image from "next/image";
import { ordinal } from "@epl/core";
import Section from "../components/shell/Section";
import TabStrip from "../components/shell/TabStrip";
import Absent from "../components/shell/Absent";
import { IndexCell } from "../components/league/TableCells";
import { BOARD, FIGURE, ROW_NAME, ROW_RULE, phoneShows } from "@/app/desk";
import { LEADER_STATS, type Leader, type LeaderStat } from "./leaders";

// This gameweek's leaders (Craig, 1 Oct 2026: "match day have 3rd tab, that shows top stats for just
// this gameweek"). A phone picks one list from a strip; a desk shows them all.

/** The Live tab's third view, by its query value. */
export const STATS_VIEW = "stats";

const TITLE: Record<LeaderStat, string> = {
  points: "Fantrax points",
  xg: "Expected goals",
  xa: "Expected assists",
  defcon: "Defensive contributions",
};

const TAB: Record<LeaderStat, string> = { points: "Points", xg: "xG", xa: "xA", defcon: "DefCon" };

/** Whose figures each list is, at the point of use (DESIGN §7); Fantrax's title already says so. */
const SOURCE: Partial<Record<LeaderStat, string>> = { xg: "FPL", xa: "FPL", defcon: "FPL" };

const DECIMALS: Partial<Record<LeaderStat, number>> = { xg: 2, xa: 2 };

/** One list's own address; the first is the view's plain one. */
export function statsHref(stat: LeaderStat): string {
  return stat === LEADER_STATS[0] ? `/matchday?view=${STATS_VIEW}` : `/matchday?view=${STATS_VIEW}&stat=${stat}`;
}

export default function TopStats({ boards, stat }: { boards: Record<LeaderStat, Leader[]>; stat: LeaderStat }) {
  return (
    <>
      <div className="lg:hidden">
        <TabStrip
          label="Which leaders"
          tabs={LEADER_STATS.map((key) => ({ key, label: TAB[key], href: statsHref(key) }))}
          current={stat}
          labels="word"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {LEADER_STATS.map((key) => (
          <div key={key} className={phoneShows(key === stat)}>
            <Section title={TITLE[key]} aside={SOURCE[key]}>
              <Board leaders={boards[key]} decimals={DECIMALS[key]} />
            </Section>
          </div>
        ))}
      </div>
    </>
  );
}

function Board({ leaders, decimals }: { leaders: Leader[]; decimals?: number }) {
  if (leaders.length === 0) return <Absent />;
  return (
    <table className={BOARD}>
      <tbody>
        {leaders.map((leader, at) => (
          <tr key={leader.player.code} className={ROW_RULE}>
            <IndexCell>{ordinal(at + 1)}</IndexCell>
            {/* `max-w-0` lets the cell take the rest of the row and truncate inside it. */}
            <td className="w-full max-w-0 pl-2">
              <span className="flex min-h-9 items-center gap-1.5 lg:min-h-7">
                {leader.crest === null ? null : (
                  <Image src={leader.crest} alt="" width={40} height={40} className="h-5 w-5 shrink-0 object-contain" />
                )}
                <span className={`${ROW_NAME} shrink-0 text-ink`}>{leader.player.name}</span>
                {/* As the wire brackets him: white, and yours in the accent. */}
                {leader.owner === null ? null : (
                  <span className={`min-w-0 truncate font-chrome text-xs lg:text-sm ${leader.mine ? "text-accent" : "text-ink"}`}>
                    ({leader.owner.teamName})
                  </span>
                )}
              </span>
            </td>
            {/* Amber: a board's one measure (DESIGN §3). */}
            <td className={`${FIGURE} w-14 text-mid lg:w-20`}>
              {decimals === undefined ? leader.value : leader.value.toFixed(decimals)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
