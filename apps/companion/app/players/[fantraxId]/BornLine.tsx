import { countryOf } from "@epl/core";
import type { FootballPlayer } from "@epl/core";
import { now } from "../../clock";
import { regions } from "../../football";
import { bornLine } from "./bio";

/** CM's `Born 2.10.79 (Age 19). English.`, in its own panel: on the Profile alone (Craig, 1 Oct 2026). */
export default async function BornLine({ player }: { player: FootballPlayer }) {
  const born = bornLine(player.birthDate, now(), countryOf(player.region, await regions()));
  if (born === null) return null;
  return (
    <p className="cm-panel cm-title px-2 py-1 text-center font-chrome text-sm font-bold text-ink lg:text-lg">
      {born}
    </p>
  );
}
