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

/** A club heading, comparable.
 *
 *  **This replaced a hardcoded table of six**, which was the six clubs the first
 *  article happened to cover. Friday's covers the other fourteen, and the six
 *  parsed to nothing at all — the caller passes the league now, from the
 *  snapshot, and a heading nobody claims is still reported rather than dropped.
 *
 *  FFS sets "BRIGHTON AND HOVE ALBION" where FPL holds "Brighton & Hove
 *  Albion", so the ampersand is spelled out and punctuation dropped before
 *  either side is looked at. */
export function clubKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

/** The per-club sections, by their <h2> headings — and every heading that looked
 *  like a club and was not recognised.
 *
 *  **The skipped list is the point.** The table used to hold six of twenty, so
 *  the first article covering the whole division parsed to nothing; an unknown
 *  heading used to be dropped in silence
 *  while the docblock claimed it was "reported, never guessed". Next week's
 *  article headed ARSENAL would have produced an empty column and no warning. */
export function sections(
  html: string,
  /** Every club that could head a section, by `clubKey`. */
  clubs: ReadonlyMap<string, string>,
): { sections: { club: string; body: string }[]; skipped: string[] } {
  const out: { club: string; body: string }[] = [];
  const skipped: string[] = [];
  const parts = html.split(/<h2[^>]*>/i);
  for (const part of parts.slice(1)) {
    const close = part.search(/<\/h2>/i);
    if (close < 0) continue;
    const printed = text(part.slice(0, close)).trim().replace(/\s+/g, " ");
    const club = clubs.get(clubKey(printed));
    if (club !== undefined) out.push({ club, body: text(part.slice(close)) });
    // Tested on the heading AS PRINTED, never on our own upper-casing: FFS sets
    // a club heading in capitals and the sidebar's in title case ("Watchlists",
    // "FPL Fixture Ticker"), and folding first made every one of them look like
    // a club — a warning on six sidebar widgets is a warning nobody reads.
    else if (/^[A-Z][A-Z' ]{3,30}$/.test(printed)) skipped.push(printed);
  }
  return { sections: out, skipped };
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
  // A BAN, not any ban: "the club's ticket ban for away fans" ruled a fit man
  // out. A footballing suspension always names its kind or its cause.
  { tag: "suspended", re: /\b(suspended|suspension|red card|(?:three|two|four|match|domestic)[- ]match ban|(?:match|domestic)[- ]ban|serves? [^.]{0,40}\bban\b)/i },
  // "is out OF CONTRACT" is not an absence, and neither is out of favour or
  // out of sorts. The preposition is the whole difference.
  { tag: "ruled_out", re: /\b(ruled out|will miss|set to miss|miss out|miss the|sit out(?! on)|remain out|are out|is out)(?! of (?:contract|favour|favor|form|sorts|the running))\b|\b(sidelined|unavailable|not travel)\b/i },
  { tag: "available", re: /\b(returns|is back|back in|available again|has trained|in contention|is fit|cleared)\b/i },
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

/** The complaint named in brackets beside HIM.
 *
 *  **Every occurrence, not the first.** It read `indexOf`, so in "Pedro Neto
 *  (thigh) is a doubt, and Joao Pedro is being assessed" the second man was
 *  given the first man's thigh. A bracket counts only where it follows the name
 *  immediately; anywhere else it belongs to somebody else. */
function condition(sentence: string, name: string): string | undefined {
  if (name === "") return undefined;
  for (let at = sentence.indexOf(name); at >= 0; at = sentence.indexOf(name, at + 1)) {
    const after = sentence.slice(at + name.length, at + name.length + 40);
    const m = after.match(/^[^.]{0,12}\(([a-z][a-z ]{2,20})\)/);
    if (m === null) continue;
    const what = m[1].trim();
    return UNNAMED.test(what) ? undefined : what;
  }
  return undefined;
}

/** A sentence's clauses, because a tag belongs to the CLAUSE a man stands in
 *  and not to every name in the sentence.
 *
 *  **The bug this exists for reached print.** Forest's section reads "Jair's
 *  possible recovery could mean a headache at centre-half, with Ola Aina and
 *  Ousmane Diomande performing well there last Saturday" — one sentence, in
 *  which "possible" belongs to Jair and Aina and Diomande are being PRAISED.
 *  Both were filed as doubts, in a club row whose own quote says "all other
 *  players will be fit". The page contradicted itself four lines apart.
 *
 *  Split on the joins that change subject, never on a comma: a comma separates
 *  the names in "Gonzalez, Ramsey and Dedic", which must stay one clause. */
export function clauses(sentence: string): string[] {
  return sentence.split(CLAUSE);
}

/** The joins that change subject. **"along with" and "together with" do not** —
 *  they continue it, and splitting there stranded four Newcastle men in a clause
 *  of their own: "All four look set to sit out Gameweek 5, along with Joelinton,
 *  Dan Burn, Ewen Jaouen and Will Osula" filed the last four as doubts when the
 *  sentence rules all eight out. */
const CLAUSE = /,? (?:but|while|whilst|although|though|however|whereas) |(?<!\balong)(?<!\btogether),? with /i;

/** Sentences, so a man is read together with what was said about him. Blocks
 *  first, then punctuation — and a block that is a quote or its "– Xabi Alonso
 *  on …" attribution is dropped, because no quote may reach the export. */
function sentences(body: string): string[] {
  return body
    .split("¶")
    .flatMap((block) => block.split(/(?<=[.!?]) +/))
    .map((line) => line.trim())
    // Dropped only when the line OPENS on a quotation mark, which is what a
    // pulled quote and its attribution look like. Testing for a quote mark
    // anywhere threw away ordinary prose — "Moises Caicedo (calf) is 'closer'
    // to a return" is a sentence about a footballer, not a quote.
    .filter((line) => line.length > 12 && !/^[“"'—–-]/.test(line) && !/^[-–—]/.test(line));
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
    for (const clause of clauses(sentence)) {
      const tag = classify(clause);
      if (tag === null) continue;
      const words = fold(clause).split(" ");
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

/** Every quote in a section, with who said it and what about.
 *
 *  FFS prints them as `"…" – Xabi Alonso on the Chelsea team news`, which is the
 *  attribution AND the subject in one line. */
export function quotes(body: string): Quote[] {
  const out: Quote[] = [];
  for (const m of body.matchAll(/[“"]([^“”"]{20,400})[”"] ?[-–—] ?([^¶]{3,200})/g)) {
    const text = m[1].trim();
    const credit = m[2].trim().replace(/[.,;]$/, "");
    const split = credit.match(/^(.+?) on (.+)$/);
    const said = (split === null ? credit : split[1]).trim();
    // **The speaker must LOOK like a name.** Any dash after a closing quote was
    // taken as the credit, so "…' - and that was all he would give on the
    // subject of his captain" published `said: "and that was all he would give"`
    // straight into a <cite>. One to three capitalised words, and nothing else.
    if (!/^[A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+){0,2}$/.test(said)) continue;
    // A subject, not a transcript of the question. The cap used to cut mid-word
    // and publish "…concerns about Reece James follo" under the quote.
    const subject = split === null ? "" : split[2].trim();
    const about = subject === "" || subject.length > 60 ? undefined : subject;
    out.push(about === undefined ? { text, said } : { text, said, about });
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
