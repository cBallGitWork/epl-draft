import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { FIRM, LEAGUE_TIMEZONE, getFootballSnapshot, type FootballSnapshot } from "@epl/core";
import { articleGameweek, clubKey, conferenceArticle, conferenceTimes, isLeagueArticle, manager, quotes, sections, text } from "./ingest/presserArticle";
import { troubles } from "./ingest/presserSignals";
import { fullClubName } from "@epl/core";

// Thursday's and Friday's press conferences, from Fantasy Football Scout's own
// team-news article into `data/intel/pressers/26-27.json`.
//
// Belongs in the sister repo (`intel-export.md` §5) and lives here until that
// repo grows the exporter. Name-matching happens HERE and never at runtime.

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Where the sister repo keeps its scrape. `FFS_SCRAPE_DIR` first; the default
 *  assumes the two repos are checked out side by side. */
const SCRAPE =
  process.env.FFS_SCRAPE_DIR ??
  join(ROOT, "..", "ai-carling-premiership", "data", "raw", "fantasy_football_scout", "daily");
const OUT = join(ROOT, "data", "intel", "pressers", "26-27.json");

/** How many of a club's quotes the brief is offered. The column prints ONE, and
 *  a whole press conference in the brief is the writer's budget spent on
 *  filler — a choice of three is a choice. */
const QUOTES_PER_CLUB = 3;

/** The stand-in when a day publishes no conference times at all. The one figure
 *  in this file nobody printed, and it is named so it reads as the guess it is. */
const MIDDAY = { hour: 12, minute: 0 };

/** A London wall-clock time as an instant. The article prints "1.30pm", which is
 *  12:30Z in September and 13:30Z in December — the offset is read rather than
 *  assumed. */
function londonInstant(day: string, hour: number, minute: number): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  const asUtc = new Date(`${day}T${pad(hour)}:${pad(minute)}:00Z`);
  const shown = new Date(asUtc.toLocaleString("en-US", { timeZone: LEAGUE_TIMEZONE }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUtc.getTime() - (shown.getTime() - utc.getTime())).toISOString();
}

/** The export, with ONE ROW PER LINE.
 *
 *  Pretty-printing every field put 144 objects across 1,129 lines — eight lines
 *  of braces each — so a single changed signal read as an eight-line diff. The
 *  sister repo's `shots` and `touches` go the other way and are one line for the
 *  whole file, which cannot be reviewed at all. This is the middle: the shape is
 *  readable and each row is one greppable, diffable line. */
function exportJson(doc: { manifest: unknown; spoke: unknown[]; quotes: unknown[]; rows: unknown[] }): string {
  const list = (name: string, rows: unknown[]): string =>
    rows.length === 0
      ? `  "${name}": []`
      : `  "${name}": [\n${rows.map((row) => `    ${JSON.stringify(row)}`).join(",\n")}\n  ]`;
  return [
    "{",
    `  "manifest": ${JSON.stringify(doc.manifest, null, 2).split("\n").join("\n  ")},`,
    `${list("spoke", doc.spoke)},`,
    `${list("quotes", doc.quotes)},`,
    list("rows", doc.rows),
    "}",
    "",
  ].join("\n");
}

/** The day's team-news article, vetted. Throws rather than returning a shape
 *  the rest of the run would have to keep checking. */
async function articleFor(day: string): Promise<{ file: string; html: string; prose: string; gameweek: number }> {
  const dir = join(SCRAPE, day);
  if (!existsSync(dir)) throw new Error(`No scrape for ${day}. The sister repo writes ${dir}.`);

  const file = conferenceArticle(readdirSync(dir));
  if (file === undefined) throw new Error(`No conferences article in ${dir}.`);

  // Cut the reader comments: the last club's section runs into them and they
  // carry hundreds of player names. Not the `hc-comment` class — the sidebar
  // uses it too.
  const html = readFileSync(join(dir, file), "utf8").split(/id="comments"/)[0];
  const prose = text(html);

  // Scout's own words decide whether this is a Premier League article; a
  // European night's conferences are a different fixture list.
  if (!isLeagueArticle(prose)) throw new Error(`${file} is not a Premier League team-news article.`);
  const gameweek = articleGameweek(prose);
  if (gameweek === null) throw new Error(`${file} does not say which gameweek it covers.`);

  return { file, html, prose, gameweek };
}

/** One day's article read into the export's three members, plus everything it
 *  could not resolve — reported, never guessed (CODE_RULES §3). */
function harvest(
  day: string,
  article: { html: string; prose: string },
  snapshot: FootballSnapshot,
): { rows: unknown[]; spoke: unknown[]; quotes: unknown[]; unmatched: string[] } {
  const rows: unknown[] = [];
  const spoke: unknown[] = [];
  const quotesFiled: unknown[] = [];
  const unmatched: string[] = [];

  const byName = new Map(snapshot.clubs.map((club) => [club.name, club]));
  // Every club the league has, under both the name FPL holds and the one a
  // paper prints — FFS heads its sections with the long form.
  const headings = new Map<string, string>();
  for (const club of snapshot.clubs) {
    headings.set(clubKey(club.name), club.name);
    headings.set(clubKey(fullClubName(club.name)), club.name);
  }

  const times = conferenceTimes(article.prose);
  const latest = [...times.values()].sort((a, b) => b.hour * 60 + b.minute - (a.hour * 60 + a.minute))[0];

  const read = sections(article.html, headings);
  for (const heading of read.skipped) unmatched.push(`club heading not in the table: ${heading}`);

  for (const section of read.sections) {
    const club = byName.get(section.club);
    if (club === undefined) {
      unmatched.push(`club: ${section.club}`);
      continue;
    }

    const whoSpoke = manager(section.body);
    // His own time where the article published one, else the day's latest — a
    // presser we cannot time had happened by then.
    const surname = (whoSpoke ?? "").toLowerCase().split(" ").pop() ?? "";
    const when = times.get((whoSpoke ?? "").toLowerCase()) ?? times.get(surname) ?? latest ?? MIDDAY;
    const at = londonInstant(day, when.hour, when.minute);

    spoke.push({ club: club.code, manager: whoSpoke, at });
    for (const quote of quotes(section.body).slice(0, QUOTES_PER_CLUB)) {
      quotesFiled.push({ club: club.code, ...quote, at });
    }

    // Within this club only, which keeps a surname from matching the wrong
    // league — the constraint `matchPlayers` applies internally.
    const squad = snapshot.players.filter((player) => player.clubId === club.id);
    for (const trouble of troubles(section.body, squad)) {
      const hit = squad.find((player) => player.name === trouble.player.name);
      if (hit === undefined) {
        unmatched.push(`${section.club}: ${trouble.player.name}`);
        continue;
      }
      rows.push({
        code: hit.code,
        club: club.code,
        tag: trouble.tag,
        // The article's own word: "hamstring" is the fact and our tag is the
        // reading of it.
        condition: trouble.condition,
        // Never a literal — `FIRM` is core's and a second copy would drift.
        confidence: FIRM,
        said: at,
        manager: whoSpoke ?? "",
      });
    }
  }

  return { rows, spoke, quotes: quotesFiled, unmatched };
}

/** This day's rows on top of the other days' — a week is TWO articles, so
 *  ingesting Friday must not wipe Thursday. */
function mergeDay(day: string, fresh: { rows: unknown[]; spoke: unknown[]; quotes: unknown[] }) {
  const kept = existsSync(OUT)
    ? (JSON.parse(readFileSync(OUT, "utf8")) as {
        spoke?: { at?: string }[];
        quotes?: { at?: string }[];
        rows?: { said?: string }[];
      })
    : {};
  // An undated row belongs to no day and no edition; keeping it duplicated the re-ingested day.
  const elsewhere = (at: unknown): boolean => typeof at === "string" && !at.startsWith(day);
  return {
    rows: [...(kept.rows ?? []).filter((row) => elsewhere(row.said)), ...fresh.rows],
    spoke: [...(kept.spoke ?? []).filter((row) => elsewhere(row.at)), ...fresh.spoke],
    quotes: [...(kept.quotes ?? []).filter((row) => elsewhere(row.at)), ...fresh.quotes],
  };
}

async function main(): Promise<void> {
  const day = process.argv[2];
  if (day === undefined) throw new Error("usage: npx tsx scripts/ingest-pressers.ts YYYY-MM-DD");

  const article = await articleFor(day);
  const snapshot = await getFootballSnapshot();
  const fresh = harvest(day, article, snapshot);
  const all = mergeDay(day, fresh);

  mkdirSync(join(OUT, ".."), { recursive: true });
  writeFileSync(
    OUT,
    exportJson({
      manifest: {
        season: "26-27",
        // The ARTICLE's round, not the snapshot's — they differ between rounds,
        // and the consumer refuses an export for the wrong one.
        gameweek: article.gameweek,
        exportedAt: new Date().toISOString(),
        rows: all.rows.length,
        sources: [{ path: join(day, article.file), mtime: null }],
      },
      ...all,
    }),
  );

  console.log(
    `${fresh.rows.length} signals, ${fresh.quotes.length} quotes across ${fresh.spoke.length} clubs on ${day} (${all.rows.length} in the export → data/intel/pressers/26-27.json)`,
  );
  if (fresh.unmatched.length > 0) {
    console.log(`\n${fresh.unmatched.length} not matched, and NOT guessed:`);
    for (const miss of fresh.unmatched) console.log(`  ${miss}`);
  }
}

main();
