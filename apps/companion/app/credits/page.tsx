import { clubGround, groundPhotoCredits } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import { LABEL, PANEL, ROW_RULE } from "@/app/desk";
import { COLUMNISTS, DESK_GROUND_CREDIT } from "../config";
import { venueCredits } from "../venues";
import { sourceLabel } from "./sourceLabel";

// Who took the photographs: each Creative Commons licence requires the author and a link to the terms.
// Prints `football/grounds.ts` and `data/leagues/venues.json`, so an uncredited picture shows here.

/** A credit's outbound link. Twice in one row and nowhere else, so it is named
 *  here rather than in `desk.ts` — CODE_RULES §1 wants three call sites before a
 *  recipe leaves the file that uses it. */
const CREDIT_LINK = "flex min-h-11 items-center text-xs underline lg:min-h-9";

export default function CreditsPage() {
  // The desk's own ground first, then each team's home, then each club's, under the name of the place it shows.
  const credits = [
    ...(DESK_GROUND_CREDIT === null
      ? []
      : [{ place: "Anfield, behind every desk screen", photo: DESK_GROUND_CREDIT }]),
    ...venueCredits().map(({ place, ...photo }) => ({ place, photo })),
    ...groundPhotoCredits().map(({ shortName, photo }) => ({
      place: clubGround(shortName) ?? shortName,
      photo,
    })),
    ...Object.entries(COLUMNISTS).map(([name, columnist]) => ({ place: `${name}, beside his column`, photo: columnist.photo })),
  ];

  return (
    <>
      <PageHeader
        title="Credits"
        competition
        sub={`${credits.length} photographs`}
      />
      <section className={PANEL}>
        <p className="text-sm text-muted">
          The photographs behind the desk, behind each club&rsquo;s screens, behind each
          team&rsquo;s home head-to-heads and beside Lawro&rsquo;s column are somebody else&rsquo;s
          work, used under the licence named beside each. Crests, kits and player portraits are the Premier League&rsquo;s own.
        </p>
        <ul className="flex flex-col">
          {credits.map(({ place, photo }) => (
            <li
              key={place}
              className={`flex flex-col gap-0.5 py-2 ${ROW_RULE}`}
            >
              <span className="font-chrome text-sm font-bold text-ink">{place}</span>
              <span className={LABEL}>{photo.title}</span>
              <span className="text-xs text-muted">{photo.author}</span>
              {/* Both links the licence requires, as controls at the tap floor. */}
              <div className="flex flex-wrap items-center gap-x-4">
                <a
                  className={CREDIT_LINK}
                  href={photo.licenceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {photo.licence}
                </a>
                <a
                  className={CREDIT_LINK}
                  href={photo.source}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceLabel(photo.source)}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
