"use client";

import { useState, type ReactNode } from "react";
import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import BenchStrip from "./BenchStrip";
import LivePlayerCard from "./LivePlayerCard";
import PitchRows, { widestLine } from "./PitchRows";
import SquadMarker from "./SquadMarker";
import SquadRows from "./SquadRows";
import SubMarker, { type SubMark } from "../football/SubMarker";
import { HEADING_PLATE } from "@/app/desk";

// A team on a scoring day: the eleven on the grass, the reserves under them, each tappable for his points.
// One mode per instance: the head-to-head board owns the Pitch/List control for both sides.

export default function TeamSheet({
  rows,
  bench,
  breakdown,
  news,
  mode,
  widest: agreed,
  eligibility,
  inColumn = false,
  bare = false,
  show,
  subs = {},
}: {
  /** The XI in its lines, arranged on the server: `slot.status` is blanked on the way, so this is the only split. */
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  /** Each player's points by the league's scoring categories, keyed by Fantrax id; empty when Fantrax refused. */
  breakdown: Record<string, BreakdownLine[]>;
  /** Fantrax's news on these men today, keyed by Fantrax id. */
  news?: Record<string, PlayerStory>;
  mode: "pitch" | "list";
  /** The pitch stands beside a list rather than alone — see `CmGround`. */
  inColumn?: boolean;
  /** The caller has boxed this already, so the list draws no box of its own. */
  bare?: boolean;
  /** What the line under each name carries — see `PitchMarker`. */
  show?: "points" | "fixture";
  /** Eligible positions by Fantrax id; a record, not a `Map`, because it crosses to the browser. */
  eligibility?: Record<string, string[]>;
  /** The card width to agree with when another sheet shares the screen; the bench takes it too. */
  widest?: number;
  /** Who came on or went off in his real match, by `fantraxId`. */
  subs?: Record<string, SubMark>;
}) {
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);


  // The bench counts as a line, so a reserve is drawn as wide as the man he would replace.
  const widest = agreed ?? widestLine([...rows, { players: bench }]);

  // `projected` is always false here: these are the live scoreboard's figures, which never project.
  return (
    // `pitch-with-bench` budgets the height of the grass and the strip under it (`pitch.css`);
    // on the list it would shrink `SquadRows`' own `cm-panel`.
    <div className={`flex flex-col ${mode === "pitch" ? "pitch-with-bench" : ""}`}>
      {mode === "pitch" ? (
        <>
          <PitchRows
            rows={rows.map((line) => ({ label: line.position, players: line.players }))}
            keyOf={(player) => player.rostered.slot.fantraxId}
            widest={widest}
            inColumn={inColumn}
          >
            {(player) => (
              <Marked mark={subs[player.rostered.slot.fantraxId]}>
                <Cell player={player} onOpen={() => setOpen(player)} show={show} />
              </Marked>
            )}
          </PitchRows>

          <BenchStrip bench={bench} rows={rows.length} widest={widest} inColumn={inColumn}>
            {(player) => (
              <Marked mark={subs[player.rostered.slot.fantraxId]}>
                <Cell player={player} onOpen={() => setOpen(player)} />
              </Marked>
            )}
          </BenchStrip>
        </>
      ) : (
        // The eleven, then the bench: a withheld side never reaches here, so the list shows the arrangement too.
        <div className="flex flex-col gap-2">
          <SquadRows
            lines={rows}
            projected={false}
            onOpen={setOpen}
            eligibility={eligibility}
            bare={bare}
          />
          {bench.length === 0 ? null : (
            <>
              {/* On a plate: nothing prints on the bare ground (DESIGN §2). */}
              <p className={HEADING_PLATE}>Bench</p>
              <SquadRows
                // One unlabelled line: `SquadRows` prints a man's position on his row.
                lines={[{ position: "", players: bench }]}
                reserve
                // No second header: the plate names the group and the columns are the eleven's.
                head={false}
                projected={false}
                onOpen={setOpen}
                eligibility={eligibility}
                bare={bare}
              />
            </>
          )}
        </div>
      )}

      {open ? (
        <LivePlayerCard
          // Remounts per player, so the dialog opens clean without an effect to sync `showModal`.
          key={open.rostered.slot.fantraxId}
          player={open}
          breakdown={breakdown[open.rostered.slot.fantraxId] ?? []}
          story={news?.[open.rostered.slot.fantraxId] ?? null}
          // The live table lists only the active eleven; without this a reserve reads as having no football.
          reserve={bench.some((p) => p.rostered.slot.fantraxId === open.rostered.slot.fantraxId)}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function Cell({
  player,
  onOpen,
  show,
}: {
  player: SquadPlayerDetail;
  onOpen: () => void;
  show?: "points" | "fixture";
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // Named: five buttons labelled "D" tell a screen reader nothing.
      aria-label={playerName(player.rostered)}
      className="block w-full"
    >
      <SquadMarker player={player} show={show} />
    </button>
  );
}

/** His card, with the minute he came on or went off if he did. */
function Marked({ mark, children }: { mark: SubMark | undefined; children: ReactNode }) {
  return (
    <SubMarker minute={mark?.minute ?? null} off={mark?.off ?? false}>
      {children}
    </SubMarker>
  );
}
