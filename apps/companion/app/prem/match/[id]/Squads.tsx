import Link from "next/link";
import type { Club, FootballPlayer, PlayerOwner } from "@epl/core";
import { clubColoursOf, inkOn, DASH } from "@epl/core";
import { IndexCell } from "../../../components/league/TableCells";
import { intelSquads } from "../../../intel";
import { PLAYER } from "../../routes";
import { BOARD, PANEL_FLUSH, ROW_NAME, ROW_RULE } from "@/app/desk";

// Both clubs' books before a ball is kicked: the man, the line he plays on and who holds him.

/** Keeper to attack, in the squad export's own lines (`CB`, `FB`, `WF`) — not the match log's, which `matchLine` orders. */
const LINES = ["GK", "CB", "FB", "DM", "CM", "AM", "WF", "CF"] as const;

export default function Squads({
  home,
  away,
  players,
  owners,
}: {
  home: Club | undefined;
  away: Club | undefined;
  /** Every footballer in the snapshot; each side is filtered here. */
  players: readonly FootballPlayer[];
  owners: Map<number, PlayerOwner>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Side club={home} players={players} owners={owners} />
      <Side club={away} players={players} owners={owners} />
    </div>
  );
}

function Side({
  club,
  players,
  owners,
}: {
  club: Club | undefined;
  players: readonly FootballPlayer[];
  owners: Map<number, PlayerOwner>;
}) {
  const colours = clubColoursOf(club);
  const squad =
    club === undefined
      ? []
      : players
          .filter((player) => player.clubId === club.id)
          .sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name));

  return (
    <section className={PANEL_FLUSH}>
      <h2
        className="flex min-h-7 items-center px-1.5 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        {club?.name ?? DASH}
      </h2>
      <table className={BOARD}>
        <tbody>
          {squad.map((player) => {
            const intel = intelSquads.get(player.code);
            const owner = owners.get(player.code);
            return (
              <tr key={player.id} className={ROW_RULE}>
                <IndexCell>{intel?.squadNumber ?? ""}</IndexCell>
                <td className="p-0">
                  <Link
                    href={`${PLAYER}/${player.code}`}
                    className="group flex min-h-11 flex-col justify-center px-1.5 lg:min-h-9"
                  >
                    <span className={`min-w-0 truncate group-hover:underline ${ROW_NAME}`}>
                      {player.name}
                    </span>
                    {owner === undefined ? null : (
                      <span className="min-w-0 truncate text-3xs text-faint">
                        {owner.teamName}
                      </span>
                    )}
                  </Link>
                </td>
                {/* His real position; a dash for the men the exporter sends as null rather than take FPL's. */}
                <td className="numeric w-10 px-1.5 text-right text-2xs text-faint">
                  {intel?.position ?? DASH}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/** Where a man sits in the reading order; a line nobody has settled sorts last. */
function depth(player: FootballPlayer): number {
  const line = intelSquads.get(player.code)?.line ?? null;
  const at = line === null ? -1 : LINES.indexOf(line as (typeof LINES)[number]);
  return at === -1 ? LINES.length : at;
}
