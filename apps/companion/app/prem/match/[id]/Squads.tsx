import type { Club, FootballPlayer, PlayerOwner, SquadPlayerDetail } from "@epl/core";
import { clubColoursOf, inkOn, DASH } from "@epl/core";
import PositionTile from "../../../components/league/PositionTile";
import { clubIndex } from "../../../components/football/clubIndex";
import { intelSquads } from "../../../intel";
import { BOARD, PANEL_FLUSH, ROW_NAME, ROW_RULE, phoneShows, SMALL_CAPS } from "@/app/desk";
import { fantraxPositions, type LeagueOpinion } from "../../leagueOpinions";
import { MaybeCard } from "./PlayerCardButton";
import OwnedBy from "./OwnedBy";
import { MATCH_ROW } from "./matchRow";

// Both clubs' books before a ball is kicked, to the team sheet's standards: the Fantrax tile in the club's colour,
// the name opening his card, who holds him, and his real position.

/** Keeper to attack, in the squad export's own lines (`CB`, `FB`, `WF`) — not the match log's, which `matchLine` orders. */
const LINES = ["GK", "CB", "FB", "DM", "CM", "AM", "WF", "CF"] as const;

export default function Squads({
  home,
  away,
  players,
  owners,
  league,
  cards,
  phoneSide,
}: {
  home: Club | undefined;
  away: Club | undefined;
  /** Every footballer in the snapshot; each side is filtered here. */
  players: readonly FootballPlayer[];
  owners: Map<number, PlayerOwner>;
  league: ReadonlyMap<number, LeagueOpinion>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  /** The one club a phone shows; a desk shows both. */
  phoneSide: "home" | "away";
}) {
  const side = (club: Club | undefined, picked: boolean) => (
    <Side club={club} players={players} owners={owners} league={league} cards={cards} phonePicked={picked} />
  );
  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-2">
      {side(home, phoneSide === "home")}
      {side(away, phoneSide === "away")}
    </div>
  );
}

function Side({
  club,
  players,
  owners,
  league,
  cards,
  phonePicked,
}: {
  club: Club | undefined;
  players: readonly FootballPlayer[];
  owners: Map<number, PlayerOwner>;
  league: ReadonlyMap<number, LeagueOpinion>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  phonePicked: boolean;
}) {
  const colours = clubColoursOf(club);
  const squad =
    club === undefined
      ? []
      : players
          .filter((player) => player.clubId === club.id)
          .sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name));

  return (
    <section className={`${PANEL_FLUSH} cm-index-scoped min-w-0 ${phoneShows(phonePicked)}`} style={clubIndex(club)}>
      <h2
        className={`flex min-h-7 items-center px-1.5 ${SMALL_CAPS}`}
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        {club?.name ?? DASH}
      </h2>
      <table className={`${BOARD} table-fixed`}>
        <tbody>
          {squad.map((player) => {
            const intel = intelSquads.get(player.code);
            const owner = owners.get(player.code);
            return (
              <tr key={player.id} className={ROW_RULE} {...MATCH_ROW}>
                <PositionTile positions={fantraxPositions(league, player.code)} cell />
                <td className="min-w-0 p-0">
                  {/* Centred in the row, the name and its owner on one baseline — the team sheet's own cell. */}
                  <MaybeCard
                    player={cards.get(player.code)}
                    className="group flex min-h-9 w-full items-center px-1.5 text-left"
                  >
                    <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                      <span className={`min-w-0 truncate group-hover:underline ${ROW_NAME}`}>{player.name}</span>
                      <OwnedBy owner={owner} className="shrink-0 truncate" />
                    </span>
                  </MaybeCard>
                </td>
                {/* His real position; a dash for the men the exporter sends as null rather than take FPL's. */}
                <td className="numeric w-10 px-1.5 text-right text-2xs text-faint">{intel?.position ?? DASH}</td>
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
