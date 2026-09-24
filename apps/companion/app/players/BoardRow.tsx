import Image from "next/image";
import type { ReactNode } from "react";
import { DASH, crestForShortName } from "@epl/core";
import { positionsLabel } from "../positions";
import { LABEL, PINNED_NAME, PINNED_TILE, ROW_FIGURE, ROW_NAME } from "@/app/desk";

// What every Data board's row shares: the pinned lead (tile, crest, name, position) and a figure's cell.

/** The tile is the desk's; the phone carries position on the name's second line. */
export const PIN_TILE = `hidden lg:table-cell ${PINNED_TILE}`;

/** The lead stays put while the figures scroll under it, starting where the desk's tile ends. */
export const PIN_NAME = `${PINNED_NAME} left-0 p-0 lg:left-14`;

/** The lead's width, for its link. */
export const LEAD_WIDTH = "w-34 px-1.5 lg:w-64";

/** One figure, centred under its head, a little tighter under a thumb. */
export const FIGURE = `numeric px-1 text-center lg:px-1.5 ${ROW_FIGURE}`;

/** His club's crest and his name, as a list sets it on a phone and in full on a desk, with `after` straight after
 *  it and his position under it on a phone. `club` is FPL's short name. */
export function LeadFace({
  club,
  name,
  fullName,
  positions,
  after,
}: {
  club: string;
  name: string;
  fullName: string;
  positions: readonly string[];
  after?: ReactNode;
}) {
  const crest = crestForShortName(club);
  return (
    <>
      <span className="grid size-6 shrink-0 place-items-center">
        {crest ? <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-baseline gap-1">
          {/* The name keeps its room; whatever follows it truncates first. */}
          <span className={`max-w-full shrink-0 truncate ${ROW_NAME}`}>
            <span className="lg:hidden">{name}</span>
            <span className="hidden lg:inline">{fullName}</span>
          </span>
          {after}
        </span>
        <span className={`${LABEL} text-2xs leading-tight lg:hidden`}>{positionsLabel(positions) ?? DASH}</span>
      </span>
    </>
  );
}
