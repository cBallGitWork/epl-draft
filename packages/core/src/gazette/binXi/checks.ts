import { BIN_XI } from "../../config";
import { BANNED, americanisms, banned } from "../banned";
import { faultLog, type Fault } from "../predictions/checks";
import { masked, numbersIn, wordCount } from "../predictions/prose";
import { DESK_BANNED } from "../predictions/words";
import { faultOn, strayFigures } from "../proofing";
import { REPORT_ADVICE, REPORT_FPL } from "../reports/words";
import { COUNTED, SOURCE } from "../sheets/checks";
import { SHEETS_AMERICAN, SHEETS_STOCK } from "../sheets/words";
import { strangers } from "../strangers";
import { BIN_MARKET, BIN_NEGLECT, BIN_OWNERSHIP, BIN_ROLES, BIN_WORKINGS } from "./words";

// The editor for the Bin XI: the column read against the facts it was written from. A hard fault
// or a send-back goes back once, quoted; what survives the rewrite files with a warning.

interface BinCheck {
  /** The brief: every name and figure the column may use. */
  brief: string;
  /** Every name in the brief, blanked before figures are read: a side called "123" is a name. */
  names: readonly string[];
}

export function checkBin(column: Record<string, unknown>, ctx: BinCheck): Fault[] {
  const { faults, fault } = faultLog();
  const text = (key: string) => (typeof column[key] === "string" ? (column[key] as string) : "");
  const figures = new Set(numbersIn(masked(ctx.brief, ctx.names)));

  // Not the deck: the desk writes the standfirst and replaces the writer's.
  for (const section of ["headline", "body"]) {
    const written = text(section);
    const plain = masked(written, ctx.names);
    faultOn(fault, section, "names a source or a percentage", "hard", SOURCE, written);
    for (const word of banned(plain, [...BIN_MARKET, ...REPORT_ADVICE])) fault(section, "the market is the wire's, and never advice", "hard", word);
    for (const word of banned(plain, [...BIN_WORKINGS, ...REPORT_FPL])) fault(section, "the desk's figures and the draft's round stay off the page", "hard", word);
    for (const word of banned(plain, BIN_NEGLECT)) fault(section, "why nobody has him is a verdict the facts cannot give", "hard", word);
    for (const word of banned(plain, BIN_ROLES)) fault(section, "a role the brief does not give", "send-back", word);
    for (const word of banned(plain, BIN_OWNERSHIP)) fault(section, "a man is in a squad, never owned or held", "send-back", word);
    for (const word of banned(plain, [...BANNED, ...DESK_BANNED, ...SHEETS_STOCK])) fault(section, "banned or stock phrasing", "send-back", word);
    for (const word of americanisms(plain, SHEETS_AMERICAN)) fault(section, "not British football English", "send-back", word);
    faultOn(fault, section, "counts the weeks", "send-back", COUNTED, written);
    if (section === "headline") continue;
    for (const figure of strayFigures(plain, figures)) fault(section, "a figure not in the brief", "hard", String(figure));
    for (const name of strangers(written, ctx.brief)) fault(section, "a name not in the brief", "hard", name);
  }

  const body = text("body");
  const paragraphs = body.split(/\n\s*\n/u).filter((each) => each.trim() !== "").length;
  const words = wordCount(body);
  const [least, most] = BIN_XI.words;
  if (paragraphs !== BIN_XI.paragraphs || words < least || words > most) {
    fault("body", "length", "send-back", `${paragraphs} paragraphs, ${words} words`);
  }
  return faults;
}
