import { assistsOf, inGameweeks, totalsOver, touchesOf } from "@epl/core";
import type { Played } from "./rates";
import type { subject } from "../[fantraxId]/subject";
import { gameLog } from "../[fantraxId]/scouting";
import { intelShots, intelTouches } from "../../intel";

/** A man whose profile read answered. */
export type Found = Extract<Awaited<ReturnType<typeof subject>>, { intel: unknown }>;

/** The range on screen: the season, or the gameweeks in it and which gameweek each fixture is. */
export interface Window {
  recent: boolean;
  inWindow: ReadonlySet<number>;
  gameweekOf: ReadonlyMap<number, number>;
}

/** One man over the window: FPL's totals (the season's, or his game log's added up), and the export's marks.
 *  A man the export never bridged has no touches, and his three export counts are a dash rather than nought. */
export async function manOver(side: Found, name: string, { recent, inWindow, gameweekOf }: Window) {
  const player = side.football?.player;
  const code = player?.code ?? -1;
  const keep = <Row extends { fplFixtureId: number }>(rows: readonly Row[]) =>
    recent ? inGameweeks(rows, gameweekOf, inWindow) : [...rows];
  const all = intelTouches.get(code);
  const touches = all === undefined ? undefined : { ...all, fixtures: keep(all.fixtures) };
  const shots = keep(intelShots.get(code) ?? []);
  const keyPasses = keep(assistsOf(intelShots, code));
  // The window is his game log: with FPL not answering it has no figures, rather than a window of noughts.
  const log = player !== undefined && recent ? await gameLog(player) : null;
  const totals =
    player === undefined
      ? null
      : recent
        ? log === null ? null : totalsOver(log.rows.map((row) => row.match), inWindow)
        : player.season;
  const played: Played | null =
    totals === null
      ? null
      : {
          ...totals,
          touches: touches === undefined ? null : touchesOf(touches, null).length,
          shots: touches === undefined ? null : shots.length,
          keyPasses: touches === undefined ? null : keyPasses.length,
        };
  return { name, club: side.football?.club, touches, shots, keyPasses, played };
}
