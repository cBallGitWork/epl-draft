"use client";

import { useState } from "react";
import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import {
  isGoalkeeper,
  isResolved,
  pitchName,
  playerName,
} from "@epl/core";
import LivePlayerCard from "./LivePlayerCard";
import PitchMarker from "./PitchMarker";
import PitchRows, { GAP_CLASS, cardBasis, rowBudget, widestLine } from "./PitchRows";
import SquadRows from "./SquadRows";
import { FAR_INSET } from "./PitchTurf";
import { positionLabel } from "../../positions";
import { LABEL } from "@/app/desk";

// A team as it lines up on a day that counts: the eleven on the grass, the
// reserves in a strip under them, and every one of them a way into what he is
// scoring.
//
// It replaced a server-rendered pitch, and the tap is the whole reason. A live
// board that shows a manager 47 points and eleven faces, and answers nothing
// when he presses one of them, has stopped one question short of the one he is
// asking.
//
// The rows come from counting active players per position, because Fantrax has
// no formation field — see `join/lineup.ts`. FPL solves the same problem with
// eight hardcoded row components, one per formation it allows; we cannot, since
// our position caps are commissioner-set and a 1-5-2-3 is legal here.
//
// One mode per instance rather than a toggle of its own: the head-to-head board
// already owns a Pitch/List control shared by both sides, and a second one
// inside each side would be two controls saying the same thing.

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
}: {
  /** The XI in its positional lines, arranged on the server — `slot.status` is
   *  blanked on the way here, so this is the last shape that knows the split.
   *  **Both views draw it now**: the list took a separately-built unarranged copy
   *  until 5 Sep 2026, so the pitch and the list disagreed about whether this
   *  screen knows who starts. */
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  /** Each player's points broken into the league's own scoring categories,
   *  keyed by Fantrax id. Empty when Fantrax refused the table. */
  breakdown: Record<string, BreakdownLine[]>;
  /** Fantrax's latest on the men in this sheet, keyed by Fantrax id. Only
   *  today's, and only for the few it has any — see `poolNews.ts`. */
  news?: Record<string, PlayerStory>;
  mode: "pitch" | "list";
  /** The pitch stands beside a list rather than alone — see `CmGround`. */
  inColumn?: boolean;
  /** The caller has drawn one box round this and whatever is beside it, so the
   *  list must not draw a second inside it. Passed straight to `SquadRows`. */
  bare?: boolean;
  /** What the line under each name carries — see `PitchMarker`. */
  show?: "points" | "fixture";
  /** Eligible positions by Fantrax id, passed straight to the list. A record
   *  rather than a `Map` because this crosses to the browser — see `SquadRows`. */
  eligibility?: Record<string, string[]>;
  /** The card width to agree with, when another sheet is on the same screen.
   *  See `PitchRows`. The bench takes it too, or the strip would go on sizing
   *  itself while the grass above it held still. */
  widest?: number;
}) {
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);


  // One number for the grass and for the strip beneath it. A reserve is the same
  // card as the man he would replace, so the bench counts as a line when the
  // width is chosen — otherwise a bench of five under a widest line of four is
  // drawn narrower than the pitch it sits under.
  const widest = agreed ?? widestLine([...rows, { players: bench }]);

  // `projected` is false wherever this passes it on, and that is a fact about
  // the source rather than a default: these numbers come off the live
  // scoreboard, which is what Fantrax has scored this period at the slot each
  // man is filling, and has no projection mode to be in. `SquadBoard` still
  // takes the flag because the season table it reads really can be projecting.
  return (
    // `pitch-with-bench`: the strip below the grass is this page's, so the
    // card's height budget has to know about it. See `globals.css`.
    // `pitch-with-bench` is a HEIGHT BUDGET for the grass and the strip under
    // it, so it belongs only on the mode that draws them. On the list it was
    // sizing a table to a pitch's screen allowance — which is why the list beside
    // the pitch had no panel edge where the phone's had one: the budget was
    // shrinking it out from under `SquadRows`' own `cm-panel`.
    <div className={`flex flex-col ${mode === "pitch" ? "pitch-with-bench" : ""}`}>
      {mode === "pitch" ? (
        <>
          {/* The trial's home now (Craig, 31 Aug). The gated squad board lost its
              pitch — fifteen men with no arrangement is not a shape — and an
              eleven is, so Championship Manager's flat diagram is drawn here,
              where there are four fewer men and room for each of them. */}
          <PitchRows
            rows={rows.map((line) => ({ label: line.position, players: line.players }))}
            keyOf={(player) => player.rostered.slot.fantraxId}
            widest={widest}
            flat
            inColumn={inColumn}
          >
            {(player) => (
              <Cell player={player} onOpen={() => setOpen(player)} show={show} />
            )}
          </PitchRows>

          {bench.length > 0 ? (
            // Off the pitch, and off the grass. A bench on green of its own put
            // four cut-outs on the same colour they were standing on ten pixels
            // above, with nothing but a shade between the two — the players
            // stopped being on a pitch and the bench stopped being a bench.
            <section className="bleed border-t border-line bg-surface pb-2 pt-2">
              {/* The pitch's own inset, not a padding of its own: `cardBasis` is
                  a share of the row it stands in, so the same share is the same
                  pixels only in a row the same width as the pitch column. */}
              <ul
                className={`flex justify-center ${GAP_CLASS}`}
                // The grass's own row count, so a reserve stands the same height as the
                // man he would replace — the strip is one row but it is not sized as one.
                style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows.length) }}
              >
                {bench.map((player) => (
                  <li
                    key={player.rostered.slot.fantraxId}
                    className="min-w-0 shrink-0"
                    style={{ flexBasis: cardBasis(widest) }}
                  >
                    <p className="pb-0.5 text-center font-display text-3xs font-bold uppercase text-faint">
                      {positionLabel(player.rostered.slot.position) ?? "—"}
                    </p>
                    <Cell player={player} onOpen={() => setOpen(player)} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        // **The eleven, then the bench** (Craig, 5 Sep 2026: "list view does not
        // have the bench, in fact, you are just putting the squad, needs the
        // eleve and bench"). He is right and the cause was one prop: the list was
        // fed `squadUnarranged`, whose entire job is to REMOVE the arrangement —
        // fifteen men sorted alphabetically within their position so that even
        // the payload order cannot leak who starts. That is the correct shape for
        // a rival's squad before his period opens, and it is not what this branch
        // is: the caller has already decided the eleven is showable (a withheld
        // side never reaches here) and the PITCH beside it has been drawing the
        // arrangement all along. One screen, two views, and only one of them knew
        // the lineup.
        //
        // Two lists rather than one with a flag, because the bench is a different
        // statement rather than a filter over the same one — which is the
        // argument `lineupDetail` already makes for returning `rows` and `bench`
        // as two fields.
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
              {/* On a plate, because nothing prints on the bare ground
                  (DESIGN §2) — the two lists draw their own panels and a heading
                  between them would sit on the photograph, which is the one
                  thing `groundfit` measures. */}
              <p className={`cm-panel px-2 py-1 text-center ${LABEL}`}>Bench</p>
              <SquadRows
                // The bench as one unlabelled line. `SquadRows` discards a
                // line's own position anyway — a man's position is a column on
                // his row (Craig, 2 Sep) — so the group needs no name.
                lines={[{ position: "", players: bench }]}
                // **No second header** (Craig, 11 Sep 2026: "we probably dont
                // need a 2nd Pos / Player / Opponent / FPts for the bench"). The
                // plate above already names this group, and the columns are the
                // same four the eleven's strip declared six rows up.
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
          // Remounts per player, so the dialog opens from a clean state rather
          // than needing an effect to keep `showModal` in step with the choice.
          key={open.rostered.slot.fantraxId}
          player={open}
          breakdown={breakdown[open.rostered.slot.fantraxId] ?? []}
          story={news?.[open.rostered.slot.fantraxId] ?? null}
          // The live table names the ACTIVE eleven only, so every reserve looks
          // like a man with no football behind him. One set, built from the prop
          // this component already has, covers both the pitch and the list.
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
      // Named, because five buttons labelled "D" tell a screen reader nothing
      // about which of the five it is on.
      aria-label={playerName(player.rostered)}
      className="block w-full"
    >
      <PitchMarker
        // The league layer's own vocabulary, translated here rather than inside
        // the marker — which is what lets a Premier League eleven use the same
        // grass without a Fantrax id anywhere near it.
        player={isResolved(player.rostered) ? player.rostered.player : null}
        label={player.rostered.slot.position || "?"}
        name={pitchName(player.rostered)}
        // **`isGoalkeeper` and not a literal `"G"`.** The position vocabulary is
        // LEAGUE data — `getLeagueInfo` names it, a commissioner can change it,
        // and `conventions.md` records the point of the helper in as many words:
        // "a league that files keepers under 'GK' needs one edit and not two".
        // This site was the second edit. Five other callers already read the
        // helper; this one compared the letter and would have drawn twenty
        // keepers in outfield shirts the day the vocabulary moved.
        keeper={isGoalkeeper(player.rostered.slot.position)}
        club={player.club}
        opposition={player.opposition}
        points={player.points}
        show={show}
      />
    </button>
  );
}
