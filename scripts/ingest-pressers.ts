import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { FIRM, getFootballSnapshot } from "@epl/core";
import { manager, quotes, sections, troubles } from "./ingest/presserArticle";

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

const SCRAPE = "/Users/craigball/ai-carling-premiership/data/raw/fantasy_football_scout/daily";
const OUT = join(fileURLToPath(new URL("..", import.meta.url)), "data", "intel", "pressers", "26-27.json");

async function main(): Promise<void> {
  const day = process.argv[2];
  if (day === undefined) throw new Error("usage: npm run pressers -- YYYY-MM-DD");

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

  const read = sections(html);
  for (const heading of read.skipped) unmatched.push(`club heading not in the table: ${heading}`);
  for (const section of read.sections) {
    const club = clubs.get(section.club);
    if (club === undefined) {
      unmatched.push(`club: ${section.club}`);
      continue;
    }
    const said = manager(section.body);
    spoke.push({ club: club.code, manager: said, at: `${day}T13:00:00.000Z` });
    // At most three per club: the column prints one and wants a choice, and a
    // whole press conference in the brief is the writer's budget spent on filler.
    for (const quote of quotes(section.body).slice(0, 3)) said_.push({ club: club.code, ...quote });

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
        said: `${day}T13:00:00.000Z`,
        manager: said ?? "",
      });
    }
  }

  mkdirSync(join(OUT, ".."), { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        manifest: {
          season: "26-27",
          gameweek: snapshot.gameweek,
          exportedAt: new Date().toISOString(),
          rows: rows.length,
          sources: [{ path: join(day, file), mtime: null }],
        },
        spoke,
        quotes: said_,
        rows,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`${rows.length} signals, ${said_.length} quotes across ${spoke.length} clubs → data/intel/pressers/26-27.json`);
  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} not matched, and NOT guessed:`);
    for (const miss of unmatched) console.log(`  ${miss}`);
  }
}

main();
