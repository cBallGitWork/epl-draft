import type { AvailabilityNote } from "@epl/core";
import Column from "./Column";
import { DOUBTS_SHOWN } from "../../config";
import { yoursBorder } from "../../mine";

// Who is hurt, across every squad — FPL's news rather than Fantrax's, whose own
// injury notes arrive truncated mid-sentence.

export default function Doubts({
  notes,
  mine,
  who,
}: {
  notes: AvailabilityNote[];
  mine: string | null;
  who: (teamId: string | null) => string;
}) {
  return (
    <Column title="Doubts" aside={`${notes.length} across the league`}>
      <ul>
        {notes.slice(0, DOUBTS_SHOWN).map((note) => (
          <li
            key={`${note.teamId}-${note.playerName}`}
            className={`py-2 pl-2 ${yoursBorder(note.teamId === mine)}`}
          >
            <p className="flex items-baseline justify-between gap-3">
              <span className="truncate font-semibold">{note.playerName}</span>
              {/* Null is not zero, and not a blank either — "FPL has not said" is
                  its own answer to a manager picking a side. */}
              <span className="numeric shrink-0 text-2xs text-faint">
                {note.chance === null ? "no word" : `${note.chance}%`}
              </span>
            </p>
            <p className="pt-0.5 text-2xs text-muted">
              {note.news ? `${note.news} · ` : null}
              {who(note.teamId)}
            </p>
          </li>
        ))}
      </ul>
    </Column>
  );
}
