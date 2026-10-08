import Image from "next/image";
import { DASH, type MatchEventKind } from "@epl/core";
import Section from "../components/shell/Section";
import { isBreak, type WireBreak, type WireLine, type WireRow } from "./wireLines";
import Absent from "@/app/components/shell/Absent";

// The vidiprinter that knows whose everybody is: Sky's teleprinter (`GOAL  LUKE AYLING (16)`), one
// row per event with both men on it, and the manager who holds each. No row is a link: every man is
// tappable one tab across, and sixty 44px controls would cost the density the panel is for.

/** The word in the event slot: Opta's vocabulary in CM's register, plus full time. */
const WORD: Record<MatchEventKind | WireBreak["kind"], string> = {
  goal: "Goal",
  "penalty-goal": "Pen",
  "own-goal": "OG",
  "disallowed-goal": "VAR",
  "yellow-card": "Booked",
  "red-card": "Red",
  substitution: "Sub",
  "full-time": "FT",
};

/** A red card, an own goal and a chalked-off goal are losses: the negative slot. */
const TONE: Partial<Record<MatchEventKind, string>> = {
  "red-card": "text-bad",
  "own-goal": "text-bad",
  "disallowed-goal": "text-bad",
};

export default function Vidiprinter({ lines }: { lines: readonly WireRow[] }) {
  if (lines.length === 0) return null;

  // No heading and no cap: the tab above names it, and a round's forty rows read down in one go.
  return (
    <Section>
      <ul className="cm-rows">
        {lines.map((row) =>
          isBreak(row) ? <BreakRow key={row.key} row={row} /> : <Row key={row.key} line={row} />,
        )}
      </ul>
    </Section>
  );
}

/** What the second man did; `As` so his manager fits at 390 (Craig, 2 Oct 2026: "Could just put 'As'"). */
const SECOND_WORD: Partial<Record<MatchEventKind, string>> = {
  goal: "As",
  "penalty-goal": "As",
  substitution: "Off",
};

/** The event word's own column, one width so the names beside it line up. `Goal` is the longest. */
const WORD_SLOT = "flex w-10 shrink-0 items-center lg:w-14";

/** One face for the whole line, figures included (Craig, 1 Oct 2026: "font is different for
 *  different things like goal etc"), so a line differs only in size: names, and everything else. */
const LINE = "flex min-h-9 items-center gap-2 font-chrome lg:min-h-7";

/** A name: the line's one step up. */
const WIRE_NAME = "text-sm font-bold lg:text-lg";

/** The rest of the line: the event word, the minute, the manager. */
const WIRE_TEXT = "text-xs lg:text-base";

/** The event word, and the second man's. */
const WIRE_WORD = `${WIRE_TEXT} font-bold uppercase`;

function Row({ line }: { line: WireLine }) {
  return (
    <li className={LINE}>
      <span className={`${WORD_SLOT} ${WIRE_WORD} ${TONE[line.kind] ?? "text-ink"}`}>
        {WORD[line.kind]}
      </span>
      {/* One line, both men (Craig, 21 Sep 2026); 5:4, because an even split clips the scorer. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Man man={line.man} club={line.club} minute={line.minute} lead />
        {/* Held open so a panel of goals keeps its columns whether or not each one was assisted. */}
        {line.second === null ? (
          <span className="min-w-0 flex-[4]" />
        ) : (
          <Man man={line.second} label={SECOND_WORD[line.kind]} />
        )}
      </div>
    </li>
  );
}

/** One man on one line: his club's crest, his name, the minute and whoever holds him (Craig, 5 Sep
 *  2026: "have the manger name after the minute number, keep it on one ron"). */
function Man({
  man,
  club,
  label,
  minute,
  lead,
}: {
  man: WireLine["man"];
  /** The club, on the first man only: the second is in the same match. */
  club?: WireLine["club"];
  /** What he did, when it is not the event's own word. */
  label?: string;
  /** The clock, bracketed after his name as Sky prints it; on the first man only. */
  minute?: string;
  /** The man the event is about, who takes the larger share of the row. */
  lead?: boolean;
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1 lg:gap-1.5 ${lead === true ? "flex-[5]" : "flex-[4]"}`}
    >
      {club === null || club === undefined ? null : (
        <Image
          src={club.crest}
          alt=""
          width={40}
          height={40}
          className="h-5 w-5 shrink-0 object-contain"
        />
      )}
      {label ? <span className={`${WIRE_WORD} shrink-0 text-muted`}>{label}</span> : null}
      {/* The name never shrinks; the manager truncates instead. */}
      <span className={`min-w-0 shrink-0 truncate text-ink ${WIRE_NAME}`}>
        {man?.player.name ?? DASH}
      </span>
      {/* Ink, as loud as the name it brackets (Craig, 1 Oct 2026: "minutes hard to see"). */}
      {minute === undefined ? null : (
        <span className={`${WIRE_TEXT} shrink-0 text-ink`}>({minute}&prime;)</span>
      )}
      {/* Bracketed like the minute; nothing for a man nobody holds, which is a fact and not a gap.
          A name is white, yours the accent (Craig, 1 Oct 2026: "manager name hard to see"). */}
      {man?.owner?.teamName === undefined ? null : (
        <span className={`${WIRE_TEXT} min-w-0 shrink truncate ${man.mine ? "text-accent" : "text-ink"}`}>
          ({man.owner.teamName})
        </span>
      )}
    </span>
  );
}

/** A match reaching full time — Sky's `FULL TIME  LEEDS 1  BRISTOL CITY 0` — on the event row's
 *  word slot and line. The clubs are names, so white; the two scores are compared, so ink. */
function BreakRow({ row }: { row: WireBreak }) {
  return (
    <li className={LINE}>
      {/* Amber, the slot for a fact and a ledger line, which a result is (Craig, 1 Oct 2026: "FT
          should be yellow, grey bad"). Not the accent: that marks your managers on these rows. */}
      <span className={`${WORD_SLOT} ${WIRE_WORD} text-mid`}>{WORD[row.kind]}</span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {row.sides.map((side) => (
          <span key={side.name} className="flex min-w-0 items-center gap-1.5">
            <Image
              src={side.crest}
              alt=""
              width={22}
              height={22}
              className="h-[1.125rem] w-[1.125rem] shrink-0 object-contain lg:h-[1.375rem] lg:w-[1.375rem]"
            />
            <span className={`${WIRE_NAME} min-w-0 truncate text-ink`}>{side.name}</span>
            <span className={`${WIRE_NAME} shrink-0 text-ink`}>{side.score ?? <Absent />}</span>
          </span>
        ))}
      </span>
    </li>
  );
}
