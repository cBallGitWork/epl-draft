import { HERE_WE_GO } from "../editorial";
import { BANNED, americanisms, banned } from "../banned";
import { faultLog, type Fault } from "../predictions/checks";
import { lengthOf, masked, numbersIn, sentences, wordCount } from "../predictions/prose";
import { DESK_BANNED } from "../predictions/words";
import { faultOn, strayFigures } from "../proofing";
import { SOURCE } from "../sheets/checks";
import { SHEETS_AMERICAN, SHEETS_STOCK } from "../sheets/words";
import { strangers } from "../strangers";
import { TRADE_INVENTED, TRADE_SIGN_OFF, TRADE_WHEN } from "./words";

// The editor for Here We Go: the item read against the trade it was written from. A hard fault or a send-back goes back
// once; a hard fault that survives the rewrite is not filed.

const EMOJI = /\p{Extended_Pictographic}/u;

export function checkTrade(column: Record<string, unknown>, ctx: { brief: string; names: readonly string[] }): Fault[] {
  const { faults, fault } = faultLog();
  // Only the body: the headline and the deck are the desk's.
  const body = typeof column.body === "string" ? column.body : "";
  const plain = masked(body, ctx.names);
  const figures = new Set(numbersIn(masked(ctx.brief, ctx.names)));

  faultOn(fault, "body", "names a source or a percentage", "hard", SOURCE, body);
  faultOn(fault, "body", "never says when the trade takes effect", "hard", TRADE_WHEN, body);
  for (const word of banned(plain, TRADE_INVENTED)) fault("body", "a draft trade has no fee, medical, contract or agent", "hard", word);
  for (const figure of strayFigures(plain, figures)) fault("body", "a figure not in the brief", "hard", String(figure));
  for (const name of strangers(body, ctx.brief)) fault("body", "a name not in the brief", "hard", name);
  for (const word of banned(plain, [...BANNED, ...DESK_BANNED, ...SHEETS_STOCK])) fault("body", "banned or stock phrasing", "send-back", word);
  for (const word of americanisms(plain, SHEETS_AMERICAN)) fault("body", "not British football English", "send-back", word);
  for (const word of banned(plain, TRADE_SIGN_OFF)) fault("body", "the desk prints the sign-off", "send-back", word);
  faultOn(fault, "body", "no emoji: the paper prints words", "send-back", EMOJI, body);

  const [least, most] = HERE_WE_GO.sentences;
  const count = sentences(body).length;
  if (count < least || count > most || wordCount(body) > HERE_WE_GO.words) fault("body", "length", "send-back", lengthOf(body));
  return faults;
}
