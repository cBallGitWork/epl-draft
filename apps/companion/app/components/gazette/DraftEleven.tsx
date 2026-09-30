import { DASH, rowNote, type StoryDraftRow, type StoryDraftSide } from "@epl/core";

// Both elevens of a draft match-up, side by side at every width as a team sheet sets two teams: each man's slot, name and
// points, a reserve under the man he replaces, and the match and day for a man still to play (Craig, 30 Sep 2026).

const HEAD = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";

function Row({ row }: { row: StoryDraftRow }) {
  const note = rowNote(row);
  return (
    <li className="flex items-baseline gap-1.5 text-sm leading-snug">
      <span className="w-3 shrink-0 font-sans text-3xs tracking-wide text-faint uppercase">{row.slot}</span>
      <span className={`min-w-0 flex-1 break-words ${row.mark === "dnp" ? "text-muted" : "text-ink"}`}>
        {row.mark === "sub" ? <span className="mr-1 font-sans text-3xs font-semibold tracking-wide text-muted uppercase">Sub</span> : null}
        {row.name}
        {note === null ? null : <span className="block text-2xs text-muted">{note}</span>}
      </span>
      <span className="numeric shrink-0 text-ink">{row.points ?? DASH}</span>
    </li>
  );
}

function Eleven({ side }: { side: StoryDraftSide }) {
  return (
    <div className="min-w-0">
      <h4 className={HEAD}>{side.name}</h4>
      <ol className="flex flex-col gap-1 pt-1.5">
        {side.eleven.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </ol>
    </div>
  );
}

export default function DraftEleven({ home, away }: { home: StoryDraftSide; away: StoryDraftSide }) {
  if (home.eleven.length + away.eleven.length === 0) return null;
  return (
    <div className="grid grid-cols-2 content-start gap-x-3 border-t pt-2 @xl:gap-x-6" style={{ borderColor: "var(--paper-rule)" }}>
      <Eleven side={home} />
      <Eleven side={away} />
    </div>
  );
}
