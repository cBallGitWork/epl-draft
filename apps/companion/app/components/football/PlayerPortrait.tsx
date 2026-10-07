"use client";

import Image from "next/image";
import { useState } from "react";
import { type ClubColours, initials, inkOn, portraitUrl } from "@epl/core";

/** The asset width: at least the largest `--row-portrait` any caller draws, or the photograph goes soft. */
const PORTRAIT_PX = 44;

/** The asset width `large` asks for. */
const LARGE_PX = 96;

// A player's headshot on his club's colour; without `sizes` the optimizer ships the full-width asset.

export default function PlayerPortrait({
  player,
  colours,
  chrome = false,
  large = false,
}: {
  player: {
    /** FPL's season-stable code, or null for a man FPL has never listed: his initials, no photograph. */
    code: number | null;
    name: string;
  };
  /** The club's colours: the disc is `primary`, and the initials take the ink that reads on it. */
  colours: ClubColours;
  /** Draw the disc in chrome instead of the club's colour, where many discs at once would flood the palette. */
  chrome?: boolean;
  /** Ask for the 500x500 source instead of the 110x140; the caller still sets the box with `--row-portrait`. */
  large?: boolean;
}) {
  const [shown, setShown] = useState<"photo" | "initials">("photo");

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full ring-1 ring-line"
      style={{
        backgroundColor: chrome ? "var(--color-chrome)" : colours.primary,
        width: "var(--row-portrait)",
        height: "var(--row-portrait)",
      }}
    >
      {/* Initials instead of a photograph, never under one: the portraits are cut-outs and would show them
          through. Reached on no code, or when the image says it failed (a code is no promise of one). */}
      {shown === "photo" && player.code !== null ? (
        <Image
          src={portraitUrl({ code: player.code }, large ? "large" : "small")}
          alt=""
          width={large ? LARGE_PX : PORTRAIT_PX}
          height={large ? LARGE_PX : PORTRAIT_PX}
          sizes={`${large ? LARGE_PX : PORTRAIT_PX}px`}
          onError={() => setShown("initials")}
          className="relative h-full w-full object-cover object-top"
        />
      ) : (
        <span
          aria-hidden
          className={`absolute inset-0 grid place-items-center font-semibold opacity-85 ${large ? "text-lg" : "text-2xs"}`}
          style={{ color: chrome ? "var(--color-ink)" : inkOn(colours) }}
        >
          {initials(player.name)}
        </span>
      )}
    </span>
  );
}
