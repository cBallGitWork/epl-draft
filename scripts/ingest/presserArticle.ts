// Fantasy Football Scout's team-news article, read as facts: this knows the ARTICLE's shape and nothing about our
// export; `ingest-pressers.ts` knows the export and nothing about HTML.

/** One thing a manager said, verbatim. Carried from the source, never composed
 *  — `voice/house.ts` forbids writing one. */
export interface Quote {
  /** The manager's own words, exactly as printed, with no quotation marks. */
  text: string;
  /** Who said it. */
  said: string;
  /** What he was asked about, when the attribution says. */
  about?: string;
}

/** The day's live conferences article, `fpl-gameweek-6-team-news-thursdays-live-injury-updates.html`, never a
 *  predicted line-ups page whose name also says team-news. The last when Scout republished it as `-2`, `-3`. */
export function conferenceArticle(names: readonly string[]): string | undefined {
  return names.filter((name) => /^fpl-gameweek-\d+-team-news-[a-z]+days-/.test(name)).sort().at(-1);
}

/** The round the ARTICLE says it is about, from its own title: "FPL Gameweek 5
 *  team news". Null when it does not say, which is a reason to refuse it. */
export function articleGameweek(body: string): number | null {
  const stated = body.match(/gameweek\s+(\d{1,2})\b/i);
  if (stated === null) return null;
  const gw = Number(stated[1]);
  return gw >= 1 && gw <= 38 ? gw : null;
}

/** Whether this is a PREMIER LEAGUE team-news article rather than a European
 *  one. Scout says so itself — "Friday's FPL Press Conferences" — and reading
 *  its own words beats a list of competitions we would have to maintain. */
export function isLeagueArticle(body: string): boolean {
  return /FPL (?:Press Conferences|Gameweek)|Gameweek \d+ team news/i.test(body);
}

/** A club heading, comparable: "&" spelled out and punctuation dropped, so
 *  FFS's "BRIGHTON AND HOVE ALBION" meets FPL's "Brighton & Hove Albion". */
export function clubKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function text(html: string): string {
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

/** The per-club sections by their <h2> headings, and every heading that looked
 *  like a club and was not recognised. A silent drop files an empty column. */
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
    // On the heading AS PRINTED: folding case first made every sidebar widget
    // ("Watchlists") look like a club.
    else if (/^[A-Z][A-Z' ]{3,30}$/.test(printed)) skipped.push(printed);
  }
  return { sections: out, skipped };
}

/** Sentences, so a man is read together with what was said about him. Blocks
 *  first, then punctuation — and a block that is a quote or its "– Xabi Alonso
 *  on …" attribution is dropped, because no quote may reach the export. */
export function sentences(body: string): string[] {
  return body
    .split("¶")
    .flatMap((block) => block.split(/(?<=[.!?]) +/))
    .map((line) => line.trim())
    // Dropped only when the line OPENS on a quote mark: a quoted word inside a
    // sentence is prose.
    .filter((line) => line.length > 12 && !/^[“"'—–-]/.test(line) && !/^[-–—]/.test(line));
}

/** When each manager spoke, by surname, from the article's own times block.
 *  A truncated tweet leaves some without one — an absence the caller handles. */
export function conferenceTimes(body: string): Map<string, { hour: number; minute: number }> {
  const out = new Map<string, { hour: number; minute: number }>();
  const block = body.match(/PRESS CONFERENCE TIMES([\s\S]{0,600})/i);
  if (block === null) return out;
  for (const m of block[1].matchAll(/(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)\s*[-–—]\s*([A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+)?)/gi)) {
    const raw = Number(m[1]);
    const minute = m[2] === undefined ? 0 : Number(m[2]);
    const pm = m[3].toLowerCase() === "pm";
    // 12am is midnight and 12pm is noon; every other hour shifts by twelve.
    const hour = raw === 12 ? (pm ? 12 : 0) : pm ? raw + 12 : raw;
    if (hour > 23 || minute > 59) continue;
    // Both the whole name and its last word, because the block prints "De
    // Zerbi" and "Le Bris" and a caller may hold either half.
    const who = m[4].toLowerCase().trim();
    out.set(who, { hour, minute });
    out.set(who.split(" ").pop() ?? who, { hour, minute });
  }
  return out;
}

/** Every quote in a section, with who said it and what about — FFS prints them
 *  as `"…" – Xabi Alonso on the Chelsea team news`. */
export function quotes(body: string): Quote[] {
  const out: Quote[] = [];
  for (const m of body.matchAll(/[“"]([^“”"]{20,400})[”"] ?[-–—] ?([^¶]{3,200})/g)) {
    const text = m[1].trim();
    const credit = m[2].trim().replace(/[.,;]$/, "");
    const split = credit.match(/^(.+?) on (.+)$/);
    const said = (split === null ? credit : split[1]).trim();
    // The speaker must LOOK like a name: any dash after a quote was taken as
    // the credit, and a trailing clause reached a <cite>.
    if (!/^[A-ZÀ-Ÿ][\wÀ-ÿ'’-]+(?: [A-ZÀ-Ÿ][\wÀ-ÿ'’-]+){0,2}$/.test(said)) continue;
    // A subject, not a transcript of the question. The cap used to cut mid-word
    // and publish "…concerns about Reece James follo" under the quote.
    const subject = split === null ? "" : split[2].trim();
    const about = subject === "" || subject.length > 60 ? undefined : subject;
    out.push(about === undefined ? { text, said } : { text, said, about });
  }
  return out;
}

/** The manager who spoke — the MODE of a section's attributions, because a
 *  section quotes its own manager several times and a rival once. */
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
