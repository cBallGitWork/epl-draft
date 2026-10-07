import { REPORT_CROWD } from "../reports/words";
import { REPORT_NEVER } from "../reports/style";

/** "Dons'", "Notemail's". */
export const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/** Football Manager's words a draft report may frame a fact with: each only in a sentence that states the fact it
 *  frames, about a side, never a quote or a named person's feeling. */
export const DRAFT_FRAMES: readonly string[] = [
  "the terraces", "the boardroom", "the board", "the dugout", "pressure", "under pressure", "the hot seat",
  "top of the pile", "bottom of the pile", "pressure mounts",
];

/** What a draft report never prints: invented speech, a press conference, and the league's own banned words. */
export const DRAFT_SPEECH: readonly string[] = [
  "said", "says", "told", "admitted", "insisted", "claimed", "revealed", "press conference", "presser", "asked about",
  "held him", "holds him", "held and",
];

/** Who is still to play is the fixture list, never a manager's choice. */
export const DRAFT_CHOICE: readonly string[] = [
  "keep back", "keeps back", "kept back", "held back", "holding back", "saving", "saved for", "in reserve", "waiting for", "waiting in",
  "chose", "chosen", "choose", "picked", "selected", "opted",
];

/** Why a man did not play is not in the facts: the brief says he did not, and nothing more. */
export const DRAFT_REASONS: readonly string[] = ["left out", "absent", "missing", "dropped", "rested", "benched", "omitted", "sidelined", "unavailable", "missed out"];

/** The brief's own labels, which a writer copies into print, and titles the league has not given ("the champions"). */
export const DRAFT_LABELS: readonly string[] = ["the twist", "the cast", "may be left out", "beats", "champion", "champions", "title holders", "the holders"];

/** A minute belongs to its own match, never measured against another's. */
export const DRAFT_CLOCK: readonly string[] = [
  "minutes earlier", "minutes later", "minutes before", "minutes after", "minute earlier", "minute later",
  "minutes-earlier", "minutes-later", "minute-earlier", "minute-later",
];

/** After Saturday the future tense is for fixtures only: never what a man or a gap will do. */
export const DRAFT_FORECAST: readonly string[] = ["could", "might", "should", "likely", "expected to", "set to", "bound to", "going to"];

/** The Prem report's never-list with the FM framing words let back in, and the speech, invented reasons, the brief's
 *  labels and another match's clock added. */
export const DRAFT_NEVER: readonly string[] = [
  ...REPORT_NEVER.filter((phrase) => !REPORT_CROWD.includes(phrase) || !DRAFT_FRAMES.some((frame) => phrase.includes(frame))),
  ...DRAFT_SPEECH,
  ...DRAFT_REASONS,
  ...DRAFT_CHOICE,
  ...DRAFT_LABELS,
  ...DRAFT_CLOCK,
];
