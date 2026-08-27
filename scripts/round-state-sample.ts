import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FPL_API_BASE, HTTP_USER_AGENT, getFootballSnapshot } from "@epl/core";
import { ROUND_STATE_ROOT } from "./paths";

// A timeline of how a round settles, written down while it happens.
//
// PLATFORM_NOTES asks whether the `bonus-settling` rung is reachable or a
// near-zero-width window — which needs `finished_provisional`, `finished`,
// `bonus_added` and `data_checked` sampled TOGETHER as they flip, and the answer
// exists only while they are flipping. Gameweek 1's window was Mon 24 Aug from
// about 21:00Z; nobody was watching, and by the 27th every flag had settled and
// the order was gone. That is the whole reason this is a cron and not a note.
//
// **Writes only when something changes.** A poll log of identical rows would be
// a commit an hour saying nothing, and the question is about ORDER, not about
// frequency — so what lands in git is one line per transition, which is the
// shape of the answer rather than the shape of the polling.

/** What we watch flip. Deliberately small: this is the ladder
 *  `packages/core/src/football/round.ts` climbs, and nothing else. */
interface RoundState {
  gameweek: number;
  /** Per fixture, whichever of the three states it is in. */
  fixtures: Record<string, string>;
  /** `finished` on every dated fixture — the rung below `dataChecked`. */
  allSettled: boolean;
  /** FPL's own sign-off, and the only thing that licenses the word "Final". */
  dataChecked: boolean;
  /** One row per match date, as `/api/event-status/` gives them. */
  bonusAdded: Record<string, boolean>;
}

/** The one read the football adapter does not make, because nothing in the app
 *  needs it — the `settled`/`dataChecked` ladder derives the same rungs from
 *  reads it already makes. It is read HERE precisely to check that claim. */
async function eventStatus(): Promise<Record<string, boolean>> {
  const response = await fetch(`${FPL_API_BASE}/event-status/`, {
    headers: { "user-agent": HTTP_USER_AGENT },
  });
  if (!response.ok) throw new Error(`event-status → ${response.status}`);
  const body = (await response.json()) as {
    status?: { date?: string; event?: number; bonus_added?: boolean }[];
  };
  const rows: Record<string, boolean> = {};
  for (const row of body.status ?? []) {
    if (typeof row.date === "string") rows[row.date] = row.bonus_added === true;
  }
  return rows;
}

async function main() {
  const snapshot = await getFootballSnapshot();
  const state: RoundState = {
    gameweek: snapshot.gameweek,
    fixtures: Object.fromEntries(
      snapshot.fixtures
        .filter((fixture) => fixture.kickoff !== null)
        .map((fixture) => [String(fixture.id), fixture.settled ? "settled" : fixture.status]),
    ),
    allSettled: snapshot.fixtures.every((fixture) => fixture.kickoff === null || fixture.settled),
    dataChecked: snapshot.dataChecked,
    bonusAdded: await eventStatus(),
  };

  mkdirSync(ROUND_STATE_ROOT, { recursive: true });
  const file = join(ROUND_STATE_ROOT, `gw${state.gameweek}.jsonl`);

  // Compared against the last line rather than against a remembered value: the
  // process is new on every run, so the file is the only memory there is.
  const previous = existsSync(file)
    ? readFileSync(file, "utf8").trimEnd().split("\n").at(-1)
    : undefined;
  const unchanged =
    previous !== undefined && previous !== "" && JSON.parse(previous).state !== undefined
      ? JSON.stringify(JSON.parse(previous).state) === JSON.stringify(state)
      : false;

  if (unchanged) {
    console.log(`gameweek ${state.gameweek}: unchanged, nothing written.`);
    return;
  }

  // `at` is ours and the state is theirs, kept apart so a reader can tell a
  // clock we control from flags we do not.
  appendFileSync(file, `${JSON.stringify({ at: new Date().toISOString(), state })}\n`);
  console.log(
    `gameweek ${state.gameweek}: recorded — ` +
      `${Object.values(state.fixtures).filter((s) => s === "settled").length}/` +
      `${Object.keys(state.fixtures).length} settled, ` +
      `dataChecked ${state.dataChecked}, ` +
      `bonus ${Object.values(state.bonusAdded).filter(Boolean).length}/` +
      `${Object.keys(state.bonusAdded).length} dates.`,
  );
}

void main();
