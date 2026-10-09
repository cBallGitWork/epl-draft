import { clubById, type FootballSnapshot, type PublishedStory } from "@epl/core";
import DraftMatchup from "./DraftMatchup";
import { STANDING_HEAD } from "./heads";
import { listMarks } from "./listMarks";

// A draft report: the gameweek's match-ups as a list, lead first, then each match-up. A phone shows one at a time, chosen
// from the list by its anchor in CSS alone, as the Prem report does; a desk shows them all, the list as contents.

export default function DraftReport({ story, snapshot }: { story: PublishedStory; snapshot: FootballSnapshot | null }) {
  const draft = story.extras?.draft;
  if (draft === undefined) return null;
  // The clubs dress each match-up's photograph in its kit; without them it prints the man alone.
  const clubs = snapshot === null ? undefined : clubById(snapshot);
  const marked = listMarks(
    "dft",
    draft.matchups.map((_, i) => `d-${i + 1}`),
  );

  return (
    <div className="dft flex flex-col pt-4">
      <style>{marked}</style>
      {draft.matchups.length < 2 ? null : (
        <nav aria-label="The gameweek's match-ups" className="dft-list flex flex-col border-t" style={{ borderColor: "var(--paper-rule)" }}>
          <h3 className={`${STANDING_HEAD} py-2`}>The match-ups</h3>
          {draft.matchups.map((m, i) => (
            <a key={i} href={`#d-${i + 1}`} className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-2 text-sm text-ink" style={{ borderColor: "var(--paper-rule)" }}>
              <span className="truncate text-right">{m.home.name}</span>
              <span className="numeric font-semibold">
                {m.home.score}-{m.away.score}
              </span>
              <span className="truncate">{m.away.name}</span>
            </a>
          ))}
        </nav>
      )}
      {/* On a phone one match-up shows: the one the list's anchor targets, or the lead. A desk shows every match-up. */}
      <div
        className="flex flex-col divide-y max-lg:[&:has(>section:target)>section:not(:target)]:hidden max-lg:[&:not(:has(>section:target))>section:not(:first-child)]:hidden"
        style={{ borderColor: "var(--paper-rule)" }}
      >
        {draft.matchups.map((m, i) => (
          <DraftMatchup key={i} matchup={m} n={i + 1} saturday={draft.cutoff === "saturday"} clubs={clubs} />
        ))}
      </div>
    </div>
  );
}
