import type { PlayerOwner, SquadPlayerDetail } from "@epl/core";
import { DASH } from "@epl/core";
import PositionTile from "../../../components/league/PositionTile";
import { chipsFor } from "../../../components/league/Chips";
import { MaybeCard } from "./PlayerCardButton";
import OwnedBy from "./OwnedBy";
import SubNote from "./SubNote";
import { ROW_NAME, ROW_RULE } from "@/app/desk";
import { appeared, type Join, type Named } from "./sheetJoin";
import { MATCH_ROW } from "./matchRow";

// One man's row on the team sheet, and the card it opens.

/** The fantasy score, the biggest thing on the row (Craig, 11 Sep 2026: *"fantasy score bigger"*). */
const SHEET_FIGURE = "text-xl lg:text-2xl";

/** Chips a row shows before it stops; the second only on a desk. */
const MARKS = 2;

/** The trigger's box, centred in the row; 36px under a thumb by PRODUCT's recorded exception. */
const NAME_CELL = "group flex min-h-9 w-full items-center px-1.5 text-left";

/** Chips the card block already draws, so the row does not say them twice. */
const CARDED = new Set(["YC", "RC"]);

export default function SheetRow({
  row,
  owner,
  positions,
  join,
  card,
  hurt,
  opensBench,
}: {
  row: Named;
  owner: PlayerOwner | undefined;
  /** What our Fantrax league fields him as — empty when it does not know him. */
  positions: readonly string[];
  join: Join;
  /** The app's player card for him, or none where our league does not list him. */
  card: SquadPlayerDetail | undefined;
  hurt: boolean;
  opensBench: boolean;
}) {
  const { man, did } = row;
  // A man who never got on has no afternoon to score; a dash, never a nought (DESIGN §7).
  const played = appeared(row);
  // Grey is "not on the pitch at the whistle" — CM's `cm9900/02.jpg` rule.
  const finished = played && did?.offAt == null;
  const line = join.line(man.code);

  return (
    <tr
      className={`${ROW_RULE} ${finished ? "" : "cm-out"} ${
        opensBench ? "border-t-4 border-t-bg" : ""
      }`}
      {...MATCH_ROW}
    >
      <PositionTile positions={positions} cell />
      {/* CM's card block between the index and the name. */}
      <td className="w-3 px-0">
        {did?.sentOff != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-bad" title={`Sent off ${did.sentOff}'`} />
        ) : did?.booked != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-accent" title={`Booked ${did.booked}'`} />
        ) : null}
      </td>
      <td className="min-w-0 p-0">
        <MaybeCard player={card} className={NAME_CELL}>
          {/* One position per row: the Fantrax tile; the real one is on the card (Craig, 23 Sep 2026). */}
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
            {/* The desk's own row size (Craig, 23 Sep 2026: *"smaller, seem quite big"*). */}
            <span className={`min-w-0 shrink truncate group-hover:underline ${ROW_NAME}`}>
              {man.name}
            </span>
            {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
            <OwnedBy owner={owner} className="shrink-0 truncate" />
            <SubNote onAt={did?.onAt} offAt={did?.offAt} hurt={hurt} />
          </span>
        </MaybeCard>
      </td>
      <td className="w-9 whitespace-nowrap px-1 text-right lg:w-16">
        <span className="inline-flex items-center gap-0.5">
          {(line === undefined ? [] : chipsFor(line))
            .filter((chip) => !CARDED.has(chip.label))
            .slice(0, MARKS)
            .map((chip, at) => (
              <span
                key={chip.label}
                className={`rounded-[1px] px-1.5 py-0.5 text-2xs font-bold lg:text-xs ${at > 0 ? "hidden lg:inline" : ""} ${chip.className}`}
              >
                {chip.label}
              </span>
            ))}
        </span>
      </td>
      {/* Cyan: a fantasy score is a reading derived from events (Craig, 4 Sep 2026). */}
      <td className={`numeric w-9 px-1 text-center font-bold text-info ${SHEET_FIGURE}`}>
        {played ? join.points(man.code) : DASH}
      </td>
    </tr>
  );
}
