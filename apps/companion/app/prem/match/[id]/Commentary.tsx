import { proseSpans, saysInjury } from "@epl/core";
import type { PlCommentaryLine } from "@epl/core";
import EventIcon, { glyphFor } from "../../../components/football/EventIcon";
import { ROW_NAME, SMALL_CAPS } from "@/app/desk";

// Opta's commentary as rows, for the Overview's Match Report: the minute in CM's blue block, a mark, the sentence.

export default function Line({
  line,
  names = [],
}: {
  line: PlCommentaryLine;
  /** Every man on either team sheet, as Opta's prose spells him — bolded where the sentence names him. */
  names?: readonly string[];
}) {
  // An injury is a substitution whose sentence says why, so it is read off the text; it takes the negative slot.
  const hurt = saysInjury(line);
  const word = hurt ? "Injury" : LOUD[line.type];
  const tone = hurt ? "text-bad" : (TONE[line.type] ?? "text-muted");
  const toned = hurt || TONE[line.type] !== undefined;
  return (
    <li className="flex min-h-9 items-stretch gap-2 lg:min-h-8">
      {/* `w-11` holds stoppage time, `90+7`. */}
      <span className="cm-index numeric flex w-11 shrink-0 items-center justify-center">
        {line.minute}&prime;
      </span>
      {/* Every row is marked; the glyph wears the row's tone, and a word stands beside it only where the sentence does not say it. */}
      <span className={`flex shrink-0 items-center gap-1 ${SMALL_CAPS} ${tone}`}>
        <EventIcon glyph={hurt ? "cross" : glyphFor(line.type)} />
        {word}
      </span>
      {/* The opening clause and the men it names set apart, not a word changed; a toned row takes weight, not white. */}
      <span
        className={`flex min-w-0 flex-1 items-center py-1 ${ROW_NAME} ${tone} lg:py-0.5`}
      >
        <span>
          {proseSpans(line.text, names).map((span, at) => (
            <span
              key={`${at}-${span.text}`}
              className={
                span.kind === "plain" ? undefined : toned ? "font-bold" : "font-bold text-ink"
              }
            >
              {span.text}
            </span>
          ))}
        </span>
      </span>
    </li>
  );
}

/** The one kind whose sentence does not lead with what it is: a penalty reads like any other goal until halfway.
 *  An injury is the other word, and `saysInjury` decides it. */
const LOUD: Record<string, string> = {
  "penalty goal": "Pen",
};

/** Each loud kind's ink: a goal is a gain, a card its own colour, and bad news the negative slot. The rest are muted. */
const TONE: Record<string, string> = {
  goal: "text-up",
  "penalty goal": "text-up",
  "yellow card": "text-accent",
  "red card": "text-bad",
  "own goal": "text-bad",
  "VAR cancelled goal": "text-bad",
};
