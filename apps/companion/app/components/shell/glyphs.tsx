import type { ReactNode } from "react";
import { PL_LION_CROWN, PL_LION_HEAD } from "./plLion";

// The thumb rail's glyphs: one 24 grid, one 2px stroke, square caps, mitred joins (DESIGN §2, Icons).
// Fills only where CM fills a cell, and the Premier League's own lion, the one mark not drawn to these rules.

/** A filled cell, where CM fills one. */
function Cell({ x, y, width = 4, height = 4 }: { x: number; y: number; width?: number; height?: number }) {
  return <rect x={x} y={y} width={width} height={height} fill="currentColor" stroke="none" />;
}

const GLYPHS = {
  gazetta: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <Cell x={5} y={6} width={14} height={3} />
      <path d="M6 12H10M6 16H10" />
      <rect x="13" y="12" width="5" height="5" />
    </>
  ),
  team: (
    <>
      <path d="M9 3H15L21 7L19 11L17 10V21H7V10L5 11L3 7Z" />
      <path d="M9 3L12 6L15 3" />
    </>
  ),
  live: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9M9 2H15M12 2V5" />
    </>
  ),
  league: (
    <>
      <Cell x={3} y={4} />
      <Cell x={3} y={10} />
      <Cell x={3} y={16} />
      <path d="M10 6H21M10 12H21M10 18H21" />
    </>
  ),
  // A straight-walled cup on a filled plinth: the two competitions under one tab.
  comps: (
    <>
      <path d="M6 3H18V9L14 13H10L6 9Z" />
      <path d="M6 5H3V8L6 11M18 5H21V8L18 11" />
      <path d="M12 13V17" />
      <Cell x={7} y={17} width={10} height={4} />
    </>
  ),
  // Bars on a baseline, upright where League's index cells lie flat.
  data: (
    <>
      <path d="M3 21H21" />
      <Cell x={4} y={11} height={8} />
      <Cell x={10} y={5} height={14} />
      <Cell x={16} y={9} height={10} />
    </>
  ),
  // The potrace box is 400 units, scaled to 20 tall and centred on the grid.
  prem: (
    <g transform="translate(0.013 -0.375) scale(0.0625)" fill="currentColor" stroke="none">
      <g transform="translate(0 400) scale(0.1 -0.1)">
        <path d={PL_LION_CROWN} />
        <path d={PL_LION_HEAD} />
      </g>
    </g>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 5L12 12L21 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12A8 8 0 1 1 17.66 6.34" />
      <path d="M20 3V8H15" />
    </>
  ),
  more: (
    <>
      <Cell x={3} y={10} />
      <Cell x={10} y={10} />
      <Cell x={17} y={10} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof GLYPHS;

/** One glyph at 24px in the text's own colour, so a current tab turns it accent with its word. */
export default function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {GLYPHS[name]}
    </svg>
  );
}
