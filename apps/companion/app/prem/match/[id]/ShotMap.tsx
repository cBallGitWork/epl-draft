"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { DASH, type Shot } from "@epl/core";
import { PITCH_BOX } from "@/app/components/football/pitchBox";
import ShotMarks, { MarksKey } from "../../../components/football/ShotMarks";
import { BOARD, ROW_RULE, SECTION_BAR } from "@/app/desk";
import { Head, HeadRow, MUTE, SortHead } from "../../../components/league/TableHeads";
import { MATCH_ROW } from "./matchRow";

// Both sides' shots on one pitch, each at its own end, and every shot in one list under it
// (Craig, 23 Sep 2026: *"one big column for both teams under the shot map"*). Tapping either picks it.

/** A shot placed on the shared pitch: home attacks the left box, away the right. */
export interface PlottedShot extends Shot {
  side: "home" | "away";
  name: string;
}

/** A club as the board draws it: its short name, its colour and the ink that reads on it, and its index block. */
export interface ShotSide {
  label: string;
  colour: string;
  ink: string;
  index: CSSProperties;
}


/** The key's own words for what became of a shot. */
const OUTCOME: Record<Shot["outcome"], string> = {
  goal: "Goal",
  save: "Saved",
  post: "Post",
  miss: "Missed",
  block: "Blocked",
};

/** How the list is ordered: by the clock, or by the chance behind the shot. */
export type ShotOrder = "minute" | "xg";

export default function ShotMap({
  shots,
  home,
  away,
  order,
  hrefs,
}: {
  shots: readonly PlottedShot[];
  home: ShotSide;
  away: ShotSide;
  order: ShotOrder;
  /** Where each head links: a sort is a link, so the server orders it (`prem/sort.ts`). */
  hrefs: Record<ShotOrder, string>;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  if (shots.length === 0) return null;

  const pick = (at: number) => setPicked((now) => (now === at ? null : at));
  const count = (side: PlottedShot["side"]) => shots.filter((shot) => shot.side === side).length;
  const listed = shots
    .map((shot, at) => ({ shot, at }))
    .sort((a, b) =>
      order === "minute"
        ? (a.shot.minute ?? Infinity) - (b.shot.minute ?? Infinity)
        : (b.shot.xg ?? -1) - (a.shot.xg ?? -1),
    );
  const chosen = picked === null ? undefined : shots[picked];

  return (
    // Capped on a desk, or a full-width pitch is 700px tall and the list starts below the fold.
    <figure className="mx-auto flex w-full max-w-3xl flex-col gap-1">
      {/* A phone's control row already names the section in view. */}
      {/* A phone's control row already names the section in view. */}
      <figcaption className={`${SECTION_BAR} max-lg:hidden`}>Shots</figcaption>
      {/* Each club's plate over the end it attacked. */}
      <div className="grid grid-cols-2 text-2xs font-bold uppercase">
        <span className="flex justify-between px-2 py-1" style={{ background: home.colour, color: home.ink }}>
          <span>{home.label}</span>
          <span className="numeric">{count("home")}</span>
        </span>
        <span className="flex justify-between px-2 py-1" style={{ background: away.colour, color: away.ink }}>
          <span className="numeric">{count("away")}</span>
          <span>{away.label}</span>
        </span>
      </div>

      <svg viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`} className="w-full" role="img" aria-label="Where both sides shot from">
        <Pitch />
        <ShotMarks shots={shots.filter((shot) => shot.side === "home")} ink={home.colour} />
        <ShotMarks shots={shots.filter((shot) => shot.side === "away")} ink={away.colour} />
        {chosen === undefined ? null : (
          <circle
            cx={chosen.x}
            cy={(chosen.y / 100) * PITCH_BOX.height}
            r="3.2"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="0.6"
          />
        )}
        {/* A tap target on every mark, laid over the drawing so the drawing stays `ShotMarks`' own. */}
        {shots.map((shot, at) => (
          <circle
            key={at}
            cx={shot.x}
            cy={(shot.y / 100) * PITCH_BOX.height}
            r="2.4"
            fill="transparent"
            className="cursor-pointer"
            onClick={() => pick(at)}
          >
            <title>{`${shot.minute ?? DASH}′ ${shot.name} · ${OUTCOME[shot.outcome]}`}</title>
          </circle>
        ))}
      </svg>
      <MarksKey />

      {/* The board standard: `BOARD` and `SortHead`, the heads every sortable table wears. */}
      <table className={`${BOARD} cm-index-scoped bg-surface`} {...MATCH_ROW}>
        <thead>
          <HeadRow>
            <SortHead
              width="w-10"
              title="Minute"
              href={hrefs.minute}
              label="Min"
              sorted={order === "minute" ? "ascending" : undefined}
            />
            <Head width="">
              <span className={MUTE}>Shooter</span>
            </Head>
            <Head width="w-20">
              <span className={MUTE}>Outcome</span>
            </Head>
            <SortHead
              width="w-12"
              title="Expected goals"
              href={hrefs.xg}
              label="xG"
              sorted={order === "xg" ? "descending" : undefined}
            />
          </HeadRow>
        </thead>
        <tbody>
          {listed.map(({ shot, at }) => (
            // The row picks the shot; the name is a button so a keyboard can too, and its click bubbles here.
            <tr
              key={at}
              onClick={() => pick(at)}
              className={`${ROW_RULE} cursor-pointer ${picked === at ? "bg-raised outline outline-1 -outline-offset-1 outline-accent" : ""}`}
            >
              <td
                className="cm-index numeric text-center"
                style={(shot.side === "home" ? home : away).index}
              >
                {shot.minute === null ? DASH : `${shot.minute}′`}
              </td>
              <td className="p-0">
                <button
                  type="button"
                  aria-pressed={picked === at}
                  className="flex min-h-9 w-full items-center px-2 text-left font-chrome text-sm font-bold lg:min-h-7"
                >
                  <span className="min-w-0 truncate">{shot.name}</span>
                </button>
              </td>
              <td
                className={`pr-2 text-right text-2xs uppercase ${shot.outcome === "goal" ? "font-bold text-ink" : "text-muted"}`}
              >
                {OUTCOME[shot.outcome]}
              </td>
              {/* xG is a model's reading, so cyan (DESIGN §3). */}
              <td className="numeric text-center text-sm text-info">
                {shot.xg === null ? DASH : shot.xg.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Turf, mown bands, and both boxes — a side attacks one end and defends the other. */
function Pitch() {
  return (
    <>
      <rect width={PITCH_BOX.width} height={PITCH_BOX.height} fill="var(--color-pitch-turf)" />
      {[0, 2, 4, 6, 8].map((band) => (
        <rect key={band} x={band * 10} width="10" height={PITCH_BOX.height} fill="var(--color-pitch-mow)" />
      ))}
      <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" opacity="0.65">
        <rect x="0.5" y="0.5" width={PITCH_BOX.width - 1} height={PITCH_BOX.height - 1} />
        <line x1="50" y1="0.5" x2="50" y2={PITCH_BOX.height - 0.5} />
        <circle cx="50" cy={PITCH_BOX.height / 2} r="9" />
        <rect x="0.5" y="13" width="16" height="38" />
        <rect x={PITCH_BOX.width - 16.5} y="13" width="16" height="38" />
        <rect x="0.5" y="24" width="5.5" height="16" />
        <rect x={PITCH_BOX.width - 6} y="24" width="5.5" height="16" />
      </g>
    </>
  );
}
