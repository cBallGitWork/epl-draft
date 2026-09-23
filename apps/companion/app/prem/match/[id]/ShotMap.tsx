"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { DASH, type Shot } from "@epl/core";
import { PITCH_BOX } from "@/app/components/football/pitchBox";
import ShotMarks, { MarksKey } from "../../../components/football/ShotMarks";
import { SECTION_BAR } from "@/app/desk";

// Both sides' shots on one pitch, each at its own end, and every shot in one list under it
// (Craig, 23 Sep 2026: *"one big column for both teams under the shot map"*). Tapping either picks it.

/** A shot placed on the shared pitch: home attacks the left box, away the right. */
export interface PlottedShot extends Shot {
  side: "home" | "away";
  name: string;
}

/** A club as the board draws it: its short name, and its colour with the ink that reads on it. */
export interface ShotSide {
  label: string;
  colour: string;
  ink: string;
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

      {/* Heads over the two columns a reader orders by, the plates every other board wears. */}
      <div className={`${GRID} text-3xs font-bold uppercase`}>
        <Head label="Min" href={hrefs.minute} on={order === "minute"} down={false} />
        <span />
        <span />
        <Head label="xG" href={hrefs.xg} on={order === "xg"} down />
      </div>

      <ol className="cm-rows cm-index-scoped bg-surface" data-tap-exception="match-row">
        {listed.map(({ shot, at }) => {
          const side = shot.side === "home" ? home : away;
          return (
            <li key={at}>
              <button
                type="button"
                onClick={() => pick(at)}
                aria-pressed={picked === at}
                className={`${GRID} min-h-9 w-full pr-1.5 text-left text-sm lg:min-h-7 ${
                  picked === at ? "bg-raised outline outline-1 -outline-offset-1 outline-accent" : ""
                }`}
              >
                <span
                  className="cm-index numeric self-stretch text-center leading-9 lg:leading-7"
                  style={{ "--cm-index": side.colour, "--cm-index-ink": side.ink } as CSSProperties}
                >
                  {shot.minute === null ? DASH : `${shot.minute}′`}
                </span>
                <span className="min-w-0 truncate font-chrome font-bold">{shot.name}</span>
                <span className={`text-2xs uppercase ${shot.outcome === "goal" ? "font-bold text-ink" : "text-muted"}`}>
                  {OUTCOME[shot.outcome]}
                </span>
                {/* xG is a model's reading, so cyan (DESIGN §3). */}
                <span className="numeric text-right text-info">{shot.xg === null ? DASH : shot.xg.toFixed(2)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

/** The list's columns: minute tile, shooter, outcome, xG — the heads above share them. */
const GRID = "grid grid-cols-[2.5rem_1fr_auto_2.5rem] items-center gap-2";

/** A column head as a link, drawn pressed with its arrow when the list is ordered by it. */
function Head({ label, href, on, down }: { label: string; href: string; on: boolean; down: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`flex h-7 items-center justify-center whitespace-nowrap px-1.5 ${on ? "cm-bevel-pressed" : "cm-bevel hover:brightness-110"}`}
    >
      {label}
      {on ? (
        <span aria-hidden className="ml-0.5 text-[0.5rem] leading-none">
          {down ? "▼" : "▲"}
        </span>
      ) : null}
    </Link>
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
