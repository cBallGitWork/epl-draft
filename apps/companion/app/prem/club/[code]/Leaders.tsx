import type { ClubColours, FootballPlayer, LeaderKey } from "@epl/core";
import { squadLeader } from "@epl/core";
import PlayerPortrait from "../../../components/football/PlayerPortrait";
import StateBox from "../../../components/football/StateBox";

// Who is carrying the season, one measure at a time.
//
// **A man per measure, and nobody when nobody has any.** `squadLeader` returns
// null before anyone has scored rather than naming a nought-scoring player top
// scorer, and this prints the row as an absence instead of dropping it — a
// missing row would say the measure does not exist, where a dash says nobody
// has one yet. DESIGN §7, applied to a claim rather than to a figure.

const MEASURES: readonly { key: LeaderKey; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "minutes", label: "Minutes" },
  { key: "cleanSheets", label: "Clean sheets" },
  { key: "saves", label: "Saves" },
  { key: "bonus", label: "Bonus" },
];

export default function Leaders({
  players,
  colours,
}: {
  players: readonly FootballPlayer[];
  colours: ClubColours;
}) {
  return (
    <ul className="cm-rows flex flex-col">
      {MEASURES.map((measure) => {
        const leader = squadLeader(players, measure.key);
        return (
          <li key={measure.key} className="flex min-h-11 items-center gap-2 px-2 py-1 lg:min-h-9">
            <span className="w-20 shrink-0 truncate text-2xs uppercase text-muted lg:w-28">
              {measure.label}
            </span>
            {leader === null ? (
              <span className="numeric flex-1 text-2xs text-faint">Nobody yet</span>
            ) : (
              <>
                <PlayerPortrait
                  player={{ code: leader.player.code, name: leader.player.name }}
                  colours={colours}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {leader.player.name}
                </span>
                <StateBox player={leader.player} />
                <span className="numeric shrink-0 text-base font-bold text-mid lg:text-lg">
                  {leader.value}
                </span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
