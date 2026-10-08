import { normalizeName } from "@epl/core";
import { sentences } from "./presserArticle";

// What the article says about whether a man is available; `presserArticle.ts` reads its shape and what was said.

/** One man the article discusses, and what it says about him. */
export interface Trouble {
  player: { name: string; fullName: string };
  tag: string;
  condition?: string;
}

/** Every name one man answers to: FPL's two, and each whole-token run of his
 *  full name — which is what catches "Berg" for Sepp van den Berg and "Moises
 *  Caicedo" for Moisés Caicedo Corozo without a loose substring match. */
function names(player: { name: string; fullName: string }): Set<string> {
  const keys = new Set([normalizeName(player.name), normalizeName(player.fullName)]);
  const tokens = normalizeName(player.fullName).split(" ");
  for (let i = 0; i < tokens.length; i += 1) {
    keys.add(tokens.slice(i).join(" "));
    keys.add(tokens.slice(0, i + 1).join(" "));
  }
  return keys;
}

/** FFS's way of writing "the club has not said". That is the ABSENCE of a
 *  complaint, and carrying it printed "Joelinton OUT — unspecified", which reads
 *  as a database field rather than as team news. */
const UNNAMED = /^(unknown|unspecified|undisclosed|n\/a)$/;

/** What a sentence says about a man's availability. The brackets are only the
 *  shorthand list; the news a reporter leads on is in the prose. */
const SAYS: { tag: string; re: RegExp }[] = [
  // A BAN, not any ban: "the club's ticket ban for away fans" ruled a fit man
  // out. A footballing suspension always names its kind or its cause.
  { tag: "suspended", re: /\b(suspended|suspension|red card|(?:three|two|four|match|domestic)[- ]match ban|(?:match|domestic)[- ]ban|serves? [^.]{0,40}\bban\b)/i },
  // "is out OF CONTRACT" is not an absence, and neither is out of favour or
  // out of sorts. The preposition is the whole difference.
  { tag: "ruled_out", re: /\b(ruled out|will miss|set to miss|miss out|miss the|sit out(?! on)|remain out|are out|is out)(?! of (?:contract|favour|favor|form|sorts|the running))\b|\b(sidelined|unavailable|not travel)\b/i },
  { tag: "available", re: /\b(returns|is back|back in|available again|has trained|in contention|is fit|fit to play|able to play|(?:is|are)(?: also)? fine|no problem|cleared)\b/i },
  { tag: "injury_scare", re: /\b(doubt|assess|scan|wait|cautious|final decision|late|fitness|injur|knock|struggl|closer|not clarify|didn.t clarify|possible|pulled out)\b/i },
  // Managing a man's load, never the word "minutes" alone — "has played the
  // most minutes of any Chelsea midfielder" is praise, not a rotation warning.
  { tag: "rotation_risk", re: /\b(rotat|rested?\b|freshen|change the team|managing [^.]{0,20}minutes|minutes (?:are|being) managed|limited minutes)/i },
];

/** "No one is ruled out for us for Friday" — Alonso's sentence contains the
 *  phrase and means its opposite, and reading it straight filed João Pedro,
 *  Neto and Caicedo as OUT on 18 Sep. A negated absence is a doubt, never a fact. */
const DENIED =
  /\b(no one|nobody|none of|neither)\b[^.]{0,40}\b(ruled out|out|suspended|missing|miss)\b|\bnot (?:been )?(?:ruled out|out|suspended|missing)\b|\b(?:will|would|does|do|did|is|are|wo)n[o']?t? (?:not )?miss\b|\b(?:will|would|does|do|did) not miss\b|\bno (?:new|fresh|further|known) (?:concerns|issues|injuries|problems)\b/i;

export function classify(sentence: string): string | null {
  for (const each of SAYS) {
    if (!each.re.test(sentence)) continue;
    if (each.tag === "ruled_out" && DENIED.test(sentence)) return "injury_scare";
    return each.tag;
  }
  return null;
}

/** The complaint in brackets beside HIM — every occurrence, because `indexOf`
 *  gave the second Pedro the first Pedro's thigh. */
function condition(sentence: string, name: string): string | undefined {
  if (name === "") return undefined;
  for (let at = sentence.indexOf(name); at >= 0; at = sentence.indexOf(name, at + 1)) {
    const after = sentence.slice(at + name.length, at + name.length + 40);
    const bracketed = after.match(/^[^.]{0,12}\(([a-z][a-z ]{2,20})\)/);
    if (bracketed === null) continue;
    const what = bracketed[1].trim();
    return UNNAMED.test(what) ? undefined : what;
  }
  return undefined;
}

/** A sentence's clauses: a tag belongs to the clause a man stands in, not to
 *  every name in the sentence. Never split on a comma — it separates names. */
export function clauses(sentence: string): string[] {
  return sentence.split(CLAUSE);
}

/** The joins that change subject. "along with" and "together with" do not —
 *  they continue it. */
const CLAUSE = /,? (?:but|while|whilst|although|though|however|whereas) |(?<!\balong)(?<!\btogether),? with /i;

/** Every man of this club the section discusses, and what it says about him.
 *  Matching is within ONE squad and every miss is reported (CODE_RULES §3). */
export function troubles(
  body: string,
  squad: readonly { name: string; fullName: string }[],
): Trouble[] {
  const found = new Map<string, Trouble>();

  // Pass one: the shorthand list each section opens with — "Nico Gonzalez
  // (head), Jacob Ramsey (thigh)". A complaint in brackets is a doubt by
  // itself, and the list carries men the prose below never returns to.
  for (const m of body.matchAll(/([A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+){0,2}) \(([a-z][a-z ]{2,20})\)/g)) {
    const whole = normalizeName(m[1]);
    const surname = whole.split(" ").pop() ?? whole;
    const hits = squad.filter((player) => names(player).has(whole));
    if (hits.length === 0) hits.push(...squad.filter((player) => names(player).has(surname)));
    if (hits.length !== 1) continue;
    const what = m[2].trim();
    const named = UNNAMED.test(what) ? undefined : what;
    found.set(hits[0].name, { player: hits[0], tag: "injury_scare", condition: named });
  }

  // Pass two: the prose, which says what the list cannot — who is actually out,
  // who is back, and the man discussed at length with no bracket at all.
  for (const sentence of sentences(body)) {
    for (const clause of clauses(sentence)) {
      const tag = classify(clause);
      if (tag === null) continue;
      const words = normalizeName(clause).split(" ");
      const mentioned = squad
        .map((player) => ({ player, span: best(words, player) }))
        .filter((each): each is { player: typeof each.player; span: { at: number; len: number } } => each.span !== null);

      for (const { player, span } of mentioned) {
        // A match sitting INSIDE a longer one is the wrong man. Pedro Neto answers
        // to "Pedro", which is the back half of "Joao Pedro" — reading it as a
        // mention filed Chelsea's news against a player nobody had named.
        const inside = mentioned.some(
          (other) =>
            other.player !== player &&
            other.span.len > span.len &&
            span.at >= other.span.at &&
            span.at + span.len <= other.span.at + other.span.len,
        );
        if (inside) continue;
        const already = found.get(player.name);
        // The prose outranks the list on WHAT WAS SAID and the list outranks it on
        // the complaint: "ruled out" is a stronger statement than a bracket, and a
        // bracket names the injury a sentence often does not.
        if (already !== undefined && already.tag !== "injury_scare") continue;
        // WHY=1 prints the sentence behind every tag, which is how a claim in the
        // paper is traced back to the article that made it.
          if (process.env.WHY) console.log(`  ${player.name} <- [${tag}] ${clause.slice(0, 130)}`);
        found.set(player.name, {
          player,
          tag,
          condition: already?.condition ?? condition(sentence, printed(sentence, player)),
        });
      }
    }
  }
  return [...found.values()];
}

/** Where a whole-token run sits, so "Wood" never matches inside "Woodwork" and
 *  the caller can tell one man's match from another's. Null when absent. */
function window(words: readonly string[], name: string): { at: number; len: number } | null {
  const want = name.split(" ");
  for (let i = 0; i + want.length <= words.length; i += 1) {
    if (want.every((token, j) => words[i + j] === token)) return { at: i, len: want.length };
  }
  return null;
}

/** His longest match in this sentence — longest because a two-word name is
 *  better evidence than the one word of it another man also answers to. */
function best(words: readonly string[], player: { name: string; fullName: string }): { at: number; len: number } | null {
  let found: { at: number; len: number } | null = null;
  for (const name of names(player)) {
    if (name.length < 4) continue;
    const at = window(words, name);
    if (at !== null && (found === null || at.len > found.len)) found = at;
  }
  return found;
}

/** How the article itself spelled him, so the bracket lookup can find him. */
function printed(sentence: string, player: { name: string; fullName: string }): string {
  for (const token of [...player.fullName.split(" "), ...player.name.split(" ")].sort((a, b) => b.length - a.length)) {
    if (token.length >= 4 && sentence.includes(token)) return token;
  }
  return player.name;
}
