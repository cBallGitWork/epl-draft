import { normalizeName } from "@epl/core";

// Fantasy Football Scout's team-news article, read as facts.
//
// Its own file because it is its own job: this knows the ARTICLE's shape and
// nothing about our export, and `ingest-pressers.ts` knows the export and
// nothing about HTML. Split when the one file passed the 300-line ceiling.

/** One thing a manager actually said, kept verbatim with its attribution.
 *
 *  **Quotes were forbidden here until 18 Sep 2026** and Craig lifted it — "you
 *  can use the actual quotes in quotation marks too if needed. like the scout
 *  does", and on the republishing worry, "its a 10 man league, its not public".
 *  The old rule is still half-right and still enforced: a quote may be CARRIED,
 *  never composed. See `voice/house.ts`. */
export interface Quote {
  /** The manager's own words, exactly as printed, with no quotation marks. */
  text: string;
  /** Who said it. */
  said: string;
  /** What he was asked about, when the attribution says. */
  about?: string;
}

/** One man the article discusses, and what it says about him. */
export interface Trouble {
  player: { name: string; fullName: string };
  tag: string;
  condition?: string;
}

/** FFS's heading against FPL's club name. Twenty clubs, so a table and not a
 *  matcher — and a heading it does not know is reported, never guessed. */
const CLUBS: Record<string, string> = {
  "CHELSEA": "Chelsea",
  "NEWCASTLE UNITED": "Newcastle",
  "NOTTINGHAM FOREST": "Nott'm Forest",
  "BRENTFORD": "Brentford",
  "HULL CITY": "Hull City",
  "COVENTRY CITY": "Coventry City",
};

/** Comparable, through the bridge's own normaliser — so "Milenković" meets
 *  "Milenkovic" and, unlike the local fold this replaced, "Groß" meets "Gross"
 *  rather than collapsing to "gro". */
function fold(name: string): string {
  return normalizeName(name);
}

/** Every name one man answers to: FPL's two, and each whole-token run of his
 *  full name — which is what catches "Berg" for Sepp van den Berg and "Moises
 *  Caicedo" for Moisés Caicedo Corozo without a loose substring match. */
function names(player: { name: string; fullName: string }): Set<string> {
  const keys = new Set([fold(player.name), fold(player.fullName)]);
  const tokens = fold(player.fullName).split(" ");
  for (let i = 0; i < tokens.length; i += 1) {
    keys.add(tokens.slice(i).join(" "));
    keys.add(tokens.slice(0, i + 1).join(" "));
  }
  return keys;
}

function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
    // A paragraph end is a full stop the markup was carrying. Losing it ran
    // Alonso's attribution into the next sentence, and "miss out on
    // international duty with Brazil" then ruled Caicedo out of a game.
    .replace(/<\/(p|li|div|blockquote|h[1-6]|tr)>|<br\s*\/?>/gi, " ¶ ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/g, " ")
    .replace(/¶(\s*¶)+/g, " ¶ ")
    .replace(/\s+/g, " ");
}

/** The per-club sections, by their <h2> headings. */
export function sections(html: string): { club: string; body: string }[] {
  const out: { club: string; body: string }[] = [];
  const parts = html.split(/<h2[^>]*>/i);
  for (const part of parts.slice(1)) {
    const close = part.search(/<\/h2>/i);
    if (close < 0) continue;
    const heading = text(part.slice(0, close)).trim().toUpperCase().replace(/\s+/g, " ");
    const club = CLUBS[heading];
    if (club !== undefined) out.push({ club, body: text(part.slice(close)) });
  }
  return out;
}

/** FFS's way of writing "the club has not said". That is the ABSENCE of a
 *  complaint, and carrying it printed "Joelinton OUT — unspecified", which reads
 *  as a database field rather than as team news. */
const UNNAMED = /^(unknown|unspecified|undisclosed|n\/a)$/;

/** What a sentence says about a man's availability. The article's parentheses
 *  are only the shorthand list — the news a reporter leads on is in the prose,
 *  and João Pedro was missed entirely on 18 Sep because Alonso refused to name
 *  the injury and so no "(knee)" existed to match. */
const SAYS: { tag: string; re: RegExp }[] = [
  { tag: "suspended", re: /\b(suspended|suspension|serves? .{0,20}ban|match ban|red card)\b/i },
  { tag: "ruled_out", re: /\b(ruled out|will miss|set to miss|miss out(?! on international)|miss the|sit out(?! on)|remain out|are out|is out|sidelined|unavailable|not travel|suspended|ban)\b/i },
  { tag: "available", re: /\b(returns|is back|back in|available again|has trained|in contention|is fit|cleared)\b/i },
  { tag: "injury_scare", re: /\b(doubt|assess|scan|wait|cautious|final decision|late|fitness|injur|knock|struggl|closer|not clarify|didn.t clarify|possible|pulled out|managing)\b/i },
  { tag: "rotation_risk", re: /\b(rotat|rest|minutes|freshen|change the team)\b/i },
];

/** "No one is ruled out for us for Friday" — Alonso's sentence contains the
 *  phrase and means its opposite, and reading it straight filed João Pedro,
 *  Neto and Caicedo as OUT on 18 Sep. A negated absence is a doubt, never a fact. */
const DENIED = /\b(no one|nobody|none of|not) (is |are |been )?(ruled out|out|suspended|missing)\b|\bno (new|fresh|further|known) (concerns|issues|injuries|problems)\b/i;

function classify(sentence: string): string | null {
  for (const each of SAYS) {
    if (!each.re.test(sentence)) continue;
    if (each.tag === "ruled_out" && DENIED.test(sentence)) return "injury_scare";
    return each.tag;
  }
  return null;
}

/** The complaint named in brackets beside him, when one is. */
function condition(sentence: string, name: string): string | undefined {
  const at = sentence.indexOf(name);
  if (at < 0) return undefined;
  const m = sentence.slice(at + name.length, at + name.length + 40).match(/^[^.]{0,12}\(([a-z][a-z ]{2,20})\)/);
  if (m === null) return undefined;
  const what = m[1].trim();
  // FFS writes "(unknown)" where the club has not said. That is the ABSENCE of a
  // complaint, and carrying it printed "Joelinton OUT — unspecified", which
  // reads as a database field rather than as team news.
  return UNNAMED.test(what) ? undefined : what;
}

/** Sentences, so a man is read together with what was said about him. Blocks
 *  first, then punctuation — and a block that is a quote or its "– Xabi Alonso
 *  on …" attribution is dropped, because no quote may reach the export. */
function sentences(body: string): string[] {
  return body
    .split("¶")
    .flatMap((block) => block.split(/(?<=[.!?]) +/))
    .map((line) => line.trim())
    .filter((line) => line.length > 12 && !/[“”"]/.test(line) && !/^[-–—]/.test(line));
}

/** Every man of this club the section discusses, and what it says about him.
 *
 *  Matching is within ONE squad and every miss is reported, which is the
 *  constraint that makes it the auditable script CODE_RULES §3 allows. */
export function troubles(
  body: string,
  squad: readonly { name: string; fullName: string }[],
): Trouble[] {
  const found = new Map<string, Trouble>();

  // Pass one: the shorthand list each section opens with — "Nico Gonzalez
  // (head), Jacob Ramsey (thigh)". A complaint in brackets is a doubt by
  // itself, and the list carries men the prose below never returns to.
  for (const m of body.matchAll(/([A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+){0,2}) \(([a-z][a-z ]{2,20})\)/g)) {
    const whole = fold(m[1]);
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
    const tag = classify(sentence);
    if (tag === null) continue;
    const words = fold(sentence).split(" ");
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
      if (process.env.WHY) console.log(`  ${player.name} <- [${tag}] ${sentence.slice(0, 140)}`);
      found.set(player.name, {
        player,
        tag,
        condition: already?.condition ?? condition(sentence, printed(sentence, player)),
      });
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

/** Every quote in a section, with who said it and what about.
 *
 *  FFS prints them as `"…" – Xabi Alonso on the Chelsea team news`, which is the
 *  attribution AND the subject in one line. */
export function quotes(body: string): Quote[] {
  const out: Quote[] = [];
  for (const m of body.matchAll(/[“"]([^“”"]{20,400})[”"] ?[-–—] ?([^¶]{3,120})/g)) {
    const text = m[1].trim();
    const credit = m[2].trim().replace(/[.,;]$/, "");
    const split = credit.match(/^(.+?) on (.+)$/);
    out.push(
      split === null
        ? { text, said: credit }
        : { text, said: split[1].trim(), about: split[2].trim() },
    );
  }
  return out;
}

/** The manager who spoke, from the quote attributions FFS prints under each one.
 *
 *  The MODE and not the first match: a section quotes its own manager several
 *  times and a rival or a player once, so the man who recurs is the man who
 *  spoke. Reading the first one gave Forest "Oliver Glasner Jair's". */
export function manager(body: string): string | null {
  const said = new Map<string, number>();
  for (const m of body.matchAll(/[”"] ?[-–—] ?([A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+){0,2})/g)) {
    // "Glasner Jair's" — a possessive is the next sentence, not part of his name.
    const name = m[1].split(" ").filter((word) => !/[’']s$/.test(word)).join(" ");
    if (name !== "") said.set(name, (said.get(name) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [name, n] of said) if (best === null || n > (said.get(best) ?? 0)) best = name;
  return best;
}
