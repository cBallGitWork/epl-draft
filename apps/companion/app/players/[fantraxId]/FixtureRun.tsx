import type { Opposition } from "@epl/core";
import Section from "../../components/shell/Section";
import { fdrStep } from "../../components/football/FixtureChip";

// What is coming, as a run rather than as a single match.
//
// The chip on a player sticker answers "who has he got this week", which is the
// wrong question for anyone deciding whether to hold him through a bad one. Five
// blocks in a row turn FPL's difficulty rating from a colour into an argument:
// two reds at the end of the run is the whole reason to sell, and it is
// invisible one fixture at a time.
//
// The colours are FPL's scale, shared with the sticker's chip rather than
// written out again, and the rating is theirs — difficulty is an opinion, and
// the only defensible one to print is the one the whole fantasy world reads.

export default function FixtureRun({ run }: { run: Opposition[] }) {
  // A club with nothing left has an empty run, and a heading over no blocks is a
  // claim that something is missing.
  if (run.length === 0) return null;

  return (
    <Section title="Next up" aside="FPL's difficulty">
      {/* Capped rather than filling the page. Five blocks stretched across a
          desktop column are billboards, and the run is meant to be read in one
          glance as a shape — five reds in a row — not one block at a time. */}
      <ol className="flex max-w-[30rem] items-stretch gap-1">
        {run.map((against) => (
          <li key={against.fixture.id} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="numeric text-center text-2xs tracking-widest text-faint">
              {/* A rearranged match can lose its round. It keeps its place in
                  the run — it is still his next game — and says so. */}
              {against.fixture.gameweek === null ? "—" : `GW${against.fixture.gameweek}`}
            </span>
            <span
              className={`numeric flex min-h-11 flex-col items-center justify-center px-1 text-xs font-bold leading-tight ${
 fdrStep(against.difficulty).ink
}`}
              style={{ backgroundColor: fdrStep(against.difficulty).ground }}
            >
              <span className="truncate">{against.club.shortName}</span>
              {/* Home or away, said in a letter as well as by nothing else —
                  there is no second visual channel carrying it here. */}
              <span className="text-2xs font-normal opacity-80">
                {against.home ? "H" : "A"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
