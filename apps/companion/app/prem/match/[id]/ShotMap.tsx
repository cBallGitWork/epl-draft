"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { DASH, fixed, type Shot } from "@epl/core";
import { PITCH_BOX, toBoxY } from "@/app/components/football/pitchBox";
import { drawOrder } from "@/app/components/football/shotGeometry";
import ShotMarks, { MarksKey } from "../../../components/football/ShotMarks";
import { KeyPassKey, KeyPassLines, KeyPassOrigins, Pitch } from "../../../components/football/ShotPitch";
import { BOARD, ROW_RULE, SECTION_BAR, SMALL_CAPS } from "@/app/desk";
import {
  Head,
  HeadRow,
  MUTE,
  SortHead,
} from "../../../components/league/TableHeads";
import { MATCH_ROW } from "./matchRow";

// Both sides' shots on one pitch, each at its own end, and every shot in one list under it
// (Craig, 23 Sep 2026: *"one big column for both teams under the shot map"*), beside the pitch on a desk.
// Tapping either picks a shot; every key pass is drawn from where it started.

/** A shot placed on the shared pitch: home attacks the left box, away the right. */
export interface PlottedShot extends Shot {
  side: "home" | "away";
  name: string;
  /** Who made it, by name, or null for an unassisted shot. */
  assister: string | null;
}

/** A club as the board draws it: its short name, its colour and the ink that reads on it, and its index block. */
export interface ShotSide {
  label: string;
  colour: string;
  ink: string;
  index: CSSProperties;
}

/** The ring round a picked shot, and the tap target over every mark — pitch units, wider than the biggest mark. */
const RING_RADIUS = 3.2;
const RING_WIDTH = 0.6;
const TAP_RADIUS = 2.4;

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
  const drawn = (["home", "away"] as const).map((key) => ({
    key,
    shots: shots.filter((shot) => shot.side === key),
    colour: (key === "home" ? home : away).colour,
  }));
  const count = (side: PlottedShot["side"]) => (side === "home" ? drawn[0] : drawn[1]).shots.length;
  const listed = shots
    .map((shot, at) => ({ shot, at }))
    .sort((a, b) =>
      order === "minute"
        ? (a.shot.minute ?? Infinity) - (b.shot.minute ?? Infinity)
        : (b.shot.xg ?? -1) - (a.shot.xg ?? -1),
    );
  const pickedShot = picked === null ? undefined : shots[picked];
  const sideOf = (shot: PlottedShot) => (shot.side === "home" ? home : away);

  return (
    // Capped on a desk, or a full-width pitch is 700px tall and the list starts below the fold.
    // The pitch and its key at the left on a desk, the list beside it; stacked under a thumb.
    <figure className="flex w-full flex-col gap-1">
      {/* A phone's control row already names the section in view. */}
      <figcaption className={`${SECTION_BAR} max-lg:hidden`}>Shots</figcaption>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Each club's plate over the end it attacked. */}
          <div className={`grid grid-cols-2 ${SMALL_CAPS}`}>
            <span
              className="flex justify-between px-2 py-1"
              style={{ background: home.colour, color: home.ink }}
            >
              <span>{home.label}</span>
              <span className="numeric">{count("home")}</span>
            </span>
            <span
              className="flex justify-between px-2 py-1"
              style={{ background: away.colour, color: away.ink }}
            >
              <span className="numeric">{count("away")}</span>
              <span>{away.label}</span>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`}
            className="w-full"
            role="img"
            aria-label="Where both sides shot from"
          >
            <Pitch />
            {/* Pass lines under the marks, their origins over them. */}
            {drawn.map((side) => (
              <KeyPassLines key={side.key} shots={side.shots} colour={side.colour} />
            ))}
            {drawn.map((side) => (
              <ShotMarks key={side.key} shots={side.shots} ink={side.colour} />
            ))}
            {drawn.map((side) => (
              <KeyPassOrigins key={side.key} shots={side.shots} colour={side.colour} />
            ))}
            {pickedShot === undefined ? null : (
              <circle
                cx={pickedShot.x}
                cy={toBoxY(pickedShot.y)}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={RING_WIDTH}
              />
            )}
            {/* A tap target on every mark, stacked as the marks are so a tap takes the one on top. */}
            {drawOrder(shots).map((at) => {
              const shot = shots[at];
              return (
                <circle
                  key={at}
                  cx={shot.x}
                  cy={toBoxY(shot.y)}
                  r={TAP_RADIUS}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => pick(at)}
                >
                  <title>{`${shot.minute ?? DASH}′ ${shot.name}${shot.assister === null ? "" : ` (A ${shot.assister})`} · ${OUTCOME[shot.outcome]}`}</title>
                </circle>
              );
            })}
          </svg>
          <MarksKey>
            <KeyPassKey />
          </MarksKey>
        </div>

        {/* The board standard: `BOARD` and `SortHead`, the heads every sortable table wears. */}
        <table
          className={`${BOARD} table-fixed cm-index-scoped bg-surface`}
          {...MATCH_ROW}
        >
          <thead>
            <HeadRow>
              <SortHead
                width="w-8"
                title="Minute"
                href={hrefs.minute}
                label="Min"
                sorted={order === "minute" ? "ascending" : undefined}
              />
              <Head>
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
                  className="cm-index numeric px-0 text-center text-2xs lg:text-xs"
                  style={sideOf(shot).index}
                >
                  {shot.minute === null ? DASH : `${shot.minute}′`}
                </td>
                <td className="min-w-0 p-0">
                  <button
                    type="button"
                    aria-pressed={picked === at}
                    // The assister under the shooter on a phone, beside him on a desk, so neither name is cut to three letters.
                    className="flex min-h-9 w-full min-w-0 flex-col px-2 py-1 text-left lg:min-h-7 lg:flex-row lg:items-baseline lg:gap-1.5"
                  >
                    <span className="min-w-0 truncate font-chrome text-sm font-bold">
                      {shot.name}
                    </span>
                    {/* The assister in the scoresheet's own spelling: a quiet `A` and his name. */}
                    {shot.assister === null ? null : (
                      <span className="min-w-0 shrink truncate text-2xs text-muted">
                        <span className="font-bold text-faint">A</span>{" "}
                        {shot.assister}
                      </span>
                    )}
                  </button>
                </td>
                <td
                  className={`pr-2 text-right text-2xs uppercase ${shot.outcome === "goal" ? "font-bold text-ink" : "text-muted"}`}
                >
                  {OUTCOME[shot.outcome]}
                </td>
                {/* xG is a model's reading, so cyan (DESIGN §3). */}
                <td className="numeric text-center text-sm text-info">
                  {shot.xg === null ? DASH : fixed(shot.xg, "expected")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
