import { clubGround, groundPhotoCredits } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import { LABEL, PANEL, ROW_RULE } from "@/app/desk";

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

export default function CreditsPage() {
  const credits = groundPhotoCredits();

  return (
    <>
      <PageHeader
        title="Credits"
        competition
        sub={`${credits.length} ground photographs`}
      />
      <section className={PANEL}>
        <p className="text-sm text-muted">
          The photograph behind each club&rsquo;s screens is somebody
          else&rsquo;s work, used under the licence named beside it. Crests,
          kits and player portraits are the Premier League&rsquo;s own.
        </p>
        <ul className="flex flex-col">
          {credits.map(({ shortName, photo }) => (
            <li
              key={shortName}
              className={`flex flex-col gap-0.5 py-2 ${ROW_RULE}`}
            >
              {/* The GROUND rather than the club: this is a page about
                  photographs of places, and `clubGround` is already the one
                  table that names them. */}
              <span className="font-chrome text-sm font-bold text-ink">
                {clubGround(shortName) ?? shortName}
              </span>
              <span className={LABEL}>{photo.title}</span>
              <span className="text-xs text-muted">
                {photo.author} ·{" "}
                <a
                  className="underline"
                  href={photo.licenceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {photo.licence}
                </a>{" "}
                ·{" "}
                <a
                  className="underline"
                  href={photo.source}
                  rel="noreferrer"
                  target="_blank"
                >
                  Wikimedia Commons
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
