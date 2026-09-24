import { clubGround, groundPhotoCredits } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import { LABEL, PANEL, ROW_RULE } from "@/app/desk";
import { COLUMNISTS, DESK_GROUND_CREDIT } from "../config";

// Who took the photographs behind the desk.
//
// **A page and not a README, because the licence is a condition of use rather
// than a courtesy.** Every ground under `public/ground/clubs/` is somebody's
// photograph under a Creative Commons licence that requires naming them and
// linking the terms; a credit in a file nothing renders satisfies neither.
// `football/grounds.ts` carries the table and this prints it, so a picture
// added without an author is visible here rather than silently uncredited.
//
// **A competition plate, not a club one.** It is the app talking about itself
// rather than a screen about somebody, which is the distinction `PageHeader`'s
// two bars draw — `cm9900/24.jpg` against `25.jpg`.

/** A credit's outbound link. Twice in one row and nowhere else, so it is named
 *  here rather than in `desk.ts` — CODE_RULES §1 wants three call sites before a
 *  recipe leaves the file that uses it. */
const CREDIT_LINK = "flex min-h-11 items-center text-xs underline lg:min-h-9";

export default function CreditsPage() {
  // The desk's own ground first, then each club's, under the name of the place it shows.
  const credits = [
    ...(DESK_GROUND_CREDIT === null
      ? []
      : [{ place: "Anfield, behind every desk screen", photo: DESK_GROUND_CREDIT }]),
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
          The photographs behind the desk, behind each club&rsquo;s screens and beside
          Lawro&rsquo;s column are somebody else&rsquo;s work, used under the licence named
          beside each. Crests, kits and player portraits are the Premier League&rsquo;s own.
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
              {/* **Two links, both required, and both laid out as controls.** CC
                  BY and CC BY-SA each ask for a link to the material AND a link
                  to the terms, so neither is decoration. They were inline words
                  inside the credit line until `tapfit` measured them: forty
                  `text-xs` anchors on one page, every one under the floor at
                  both widths, which was the worst tap failure in the app. The
                  heights are the desk's own — 44 under a thumb, 36 where it
                  keeps its own proportions. */}
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
                  Wikimedia Commons
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
