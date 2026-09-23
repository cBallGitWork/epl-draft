import Link from "next/link";
import type { Club, FootballPlayer, PlayerOwner } from "@epl/core";
import { clubColoursOf, inkOn, DASH } from "@epl/core";
import { IndexCell } from "../../../components/league/TableCells";
import { intelSquads } from "../../../intel";
import { PLAYER } from "../../routes";
import { BOARD, PANEL_FLUSH, ROW_NAME, ROW_RULE } from "@/app/desk";

// Both clubs' books, before a ball is kicked (Craig, 4 Sep 2026: *"players tab
// can just be the two squad lists (like we do on the actual team page, but just
// a list, no team page)"*).
//
// **The same shape the played board has, with the two columns that need a match
// taken out.** No points, because nobody has scored any; no sub note, because
// nobody has come off. What is left is the shirt number, the man, the line he
// plays on and who holds him — which is the whole of what a manager wants from a
// fixture on a Thursday.
//
// `/prem/club/[code]` draws the same men with more about each; this is
// deliberately not that page, because the question here is who is in THIS match.

/** The order a squad is read in, keeper to attack. The sister repo's own
 *  bucketing (`IntelPlayer.line`), not a second taxonomy of ours — it owns the
 *  football vocabulary and a copy here would be a second thing to be wrong.
 *
 *  Note it is NOT the match log's vocabulary, which `matchLine` orders: that one
 *  is SofaScore's per-match line codes (`DC`, `AMC`, `FWL`) and this is the
 *  squad export's (`CB`, `FB`, `WF`). Two files, two providers, two taxonomies,
 *  and `realPositions.ts` records the same split. */
const LINES = ["GK", "CB", "FB", "DM", "CM", "AM", "WF", "CF"] as const;

export default function Squads({
  home,
  away,
  players,
  owners,
}: {
  home: Club | undefined;
  away: Club | undefined;
  /** Every footballer in the snapshot; each side is filtered out of it here so
   *  the caller does not do the same filter twice. */
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
                {/* His real position, and a dash for the 146 of 651 the exporter
                    sends as null on purpose — those came from FPL's own fantasy
                    classification, which the football layer refuses by rule. */}
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

/** Where a man sits in the reading order. A line nobody has settled sorts last,
 *  for `matchLine`'s reason: a man our sources have no opinion about belongs
 *  under the ones they do, not in goal. */
function depth(player: FootballPlayer): number {
  const line = intelSquads.get(player.code)?.line ?? null;
  const at = line === null ? -1 : LINES.indexOf(line as (typeof LINES)[number]);
  return at === -1 ? LINES.length : at;
}
