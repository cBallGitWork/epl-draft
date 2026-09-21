import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { FIRM, LEAGUE_TIMEZONE, getFootballSnapshot } from "@epl/core";
import { clubKey, conferenceTimes, manager, quotes, sections, text, troubles } from "./ingest/presserArticle";
import { fullClubName } from "@epl/core";

// Thursday's and Friday's press conferences, from Fantasy Football Scout's own
// team-news article into `data/intel/pressers/26-27.json`.
//
// **It belongs in the sister repo and lives here for now.** §5 of
// `docs/providers/intel-export.md` says `~/ai-carling-premiership` writes this
// file; it has the scrape and not the exporter. This reads that scrape directly
// so the column has real news rather than a hand-written fixture, which is what
// it had until 18 Sep 2026 and what made it print a Palace player under a Spurs
// crest.
//
// **Name-matching happens HERE and never at runtime** — CODE_RULES §3's rule
// for exactly this shape: a script that matches once, reports what it could not,
// and writes a data file a person can read.

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Where the sister repo keeps its scrape.
 *
 *  **`FFS_SCRAPE_DIR` first, and the default is DERIVED** — it was an absolute
 *  path into one developer's home directory, which is a machine's fact rather
 *  than the project's and works nowhere else. The fallback assumes the two
 *  repos are checked out side by side, which is how they are. */
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

async function main(): Promise<void> {
  const day = process.argv[2];
  if (day === undefined) throw new Error("usage: npx tsx scripts/ingest-pressers.ts YYYY-MM-DD");

  const dir = join(SCRAPE, day);
  if (!existsSync(dir)) throw new Error(`No scrape for ${day}. The sister repo writes ${dir}.`);

  const { readdirSync } = await import("node:fs");
  const file = readdirSync(dir).find((name) => /team-news/.test(name));
  if (file === undefined) throw new Error(`No team-news article in ${dir}.`);

  // Cut the reader comments: the last club's section runs into them, and they
  // carry hundreds of player names and no news at all. That is how "Egan (new)"
  // from a comment thread was read as Coventry team news. The split is on
  // `id="comments"` and not the `hc-comment` class, which the sidebar uses too.
  const html = readFileSync(join(dir, file), "utf8").split(/id="comments"/)[0];
  const snapshot = await getFootballSnapshot();
  const clubs = new Map(snapshot.clubs.map((club) => [club.name, club]));

  const rows: unknown[] = [];
  const spoke: unknown[] = [];
  const said_: unknown[] = [];
  const unmatched: string[] = [];

  // Every club the league has, under both the name FPL holds and the one a
  // paper prints — FFS heads its sections with the long form.
  const headings = new Map<string, string>();
  for (const club of snapshot.clubs) {
    headings.set(clubKey(club.name), club.name);
    headings.set(clubKey(fullClubName(club.name)), club.name);
  }

  // When each manager actually spoke, from the article's own block.
  const times = conferenceTimes(text(html));
  const latest = [...times.values()].sort((a, b) => b.hour * 60 + b.minute - (a.hour * 60 + a.minute))[0];

  const read = sections(html, headings);
  for (const heading of read.skipped) unmatched.push(`club heading not in the table: ${heading}`);
  for (const section of read.sections) {
    const club = clubs.get(section.club);
    if (club === undefined) {
      unmatched.push(`club: ${section.club}`);
      continue;
    }
    const said = manager(section.body);
    // His own conference time where the article published one. Where it did not
    // — FFS's block is a tweet and a long list is truncated — the LATEST time
    // published that day, because a presser we cannot time had happened by
    // then. A day with no block at all falls to midday, which is the only
    // figure here nobody published and is named as such.
    const surname = (said ?? "").toLowerCase().split(" ").pop() ?? "";
    const when = times.get((said ?? "").toLowerCase()) ?? times.get(surname) ?? latest ?? MIDDAY;
    const at = londonInstant(day, when.hour, when.minute);
    spoke.push({ club: club.code, manager: said, at });
    // At most three per club: the column prints one and wants a choice, and a
    // whole press conference in the brief is the writer's budget spent on filler.
    for (const quote of quotes(section.body).slice(0, QUOTES_PER_CLUB))
      said_.push({ club: club.code, ...quote, at });

    // Within this club only, which is what keeps a surname from matching the
    // wrong league. Same constraint `matchPlayers` applies internally.
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
        // The article's own word, kept: "hamstring" is the fact, and our tag is
        // the reading of it.
        condition: trouble.condition,
        // The article states a fact, so it enters at the floor a FACT sits on.
        // Never a literal: `FIRM` is core's and a second copy would drift from it.
        confidence: FIRM,
        said: at,
        manager: said ?? "",
      });
    }
  }

  // **Merged by DAY, never replaced.** Craig, 21 Sep 2026: "pressers are now
  // split between thrusday and friday". Thursday's article covers the clubs
  // playing first and Friday's covers the rest, so a week is TWO articles and
  // the export must hold both — ingesting Friday used to wipe Thursday, and the
  // column for the day already filed lost the data behind it.
  const kept = existsSync(OUT)
    ? (JSON.parse(readFileSync(OUT, "utf8")) as {
        spoke?: { at?: string }[];
        quotes?: { at?: string }[];
        rows?: { said?: string }[];
      })
    : {};
  const otherDay = (at: unknown): boolean => typeof at !== "string" || !at.startsWith(day);
  const allRows = [...(kept.rows ?? []).filter((r) => otherDay(r.said)), ...rows];
  const allSpoke = [...(kept.spoke ?? []).filter((r) => otherDay(r.at)), ...spoke];
  const allQuotes = [...(kept.quotes ?? []).filter((r) => otherDay(r.at)), ...said_];

  mkdirSync(join(OUT, ".."), { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        manifest: {
          season: "26-27",
          gameweek: snapshot.gameweek,
          exportedAt: new Date().toISOString(),
          rows: allRows.length,
          sources: [{ path: join(day, file), mtime: null }],
        },
        spoke: allSpoke,
        quotes: allQuotes,
        rows: allRows,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`${rows.length} signals, ${said_.length} quotes across ${spoke.length} clubs on ${day} (${allRows.length} in the export → data/intel/pressers/26-27.json)`);
  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} not matched, and NOT guessed:`);
    for (const miss of unmatched) console.log(`  ${miss}`);
  }
}

main();
