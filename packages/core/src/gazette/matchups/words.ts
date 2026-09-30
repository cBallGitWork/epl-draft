import { REPORT_CROWD } from "../reports/words";
import { REPORT_NEVER } from "../reports/style";

/** "Dons'", "Notemail's". */
export const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/** Football Manager's words a draft report may frame a fact with (Craig, 29 Sep 2026: "FM register as framing"): each
 *  only in a sentence that states the fact it frames, about a side, never a quote or a named person's feeling. */
export const DRAFT_FRAMES: readonly string[] = [
  "the terraces", "the boardroom", "the board", "the dugout", "pressure", "under pressure", "the hot seat",
  "top of the pile", "bottom of the pile", "pressure mounts",
];

/** What a draft report never prints: invented speech, a press conference, and the league's own banned words. */
export const DRAFT_SPEECH: readonly string[] = [
  "said", "says", "told", "admitted", "insisted", "claimed", "revealed", "press conference", "presser", "asked about",
  "held him", "holds him", "held and", "came on", "came off",
];

/** Who is still to play is the fixture list, never a manager's choice (Craig, 30 Sep 2026: "makes it sound like the
 *  manager made a choice"). */
export const DRAFT_CHOICE: readonly string[] = ["keep back", "keeps back", "kept back", "held back", "holding back", "saving", "saved for", "in reserve", "waiting for", "waiting in"];

/** Why a man did not play is not in the facts: the brief says he did not, and nothing more. */
export const DRAFT_REASONS: readonly string[] = ["left out", "absent", "missing", "dropped", "rested", "benched", "omitted", "sidelined"];

/** The Prem report's never-list with the FM framing words let back in, and the speech and invented reasons added. */
export const DRAFT_NEVER: readonly string[] = [
  ...REPORT_NEVER.filter((phrase) => !REPORT_CROWD.includes(phrase) || !DRAFT_FRAMES.some((frame) => phrase.includes(frame))),
  ...DRAFT_SPEECH,
  ...DRAFT_REASONS,
  ...DRAFT_CHOICE,
];
