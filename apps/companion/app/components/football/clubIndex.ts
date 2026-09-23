import type { CSSProperties } from "react";
import { type Club, clubColoursOf, inkOn } from "@epl/core";

/** CM's index block re-pointed to a club's colour, with the ink that reads on it. Pair it with
 *  `cm-index-scoped`, which keeps the block's contrast against a colour we did not choose (`desk.css`). */
export function clubIndex(club: Club | undefined): CSSProperties {
  const colours = clubColoursOf(club);
  return { "--cm-index": colours.primary, "--cm-index-ink": inkOn(colours) } as CSSProperties;
}
