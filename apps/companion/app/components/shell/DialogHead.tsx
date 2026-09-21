import { clubColours, plateOn } from "@epl/core";

// The bar a dialog about a SUBJECT opens with, in that subject's own colours.
//
// **Championship Manager opens every screen with one** and three of this app's
// dialogs are about one man — the squad card, the live card and the match card.
// The first two had drifted into web cards with a heading inside the body; the
// third set its name a third way again. Counted 21 Sep 2026: the dialog `<h2>`
// was drawn four ways, in two faces and three sizes.
//
// **It carries the name and nothing else**, which is `PageHeader`'s rule read
// off `cm9900/25.jpg` — a title bar is the SUBJECT of the screen and the game
// puts nothing else in it. Everything a card used to crowd in beside the name
// goes on the line under it.
//
// **Not `PageHeader`.** That draws a PAGE's bar and the two differ in eight
// attributes — height, alignment, case, padding, heading level, the `lg:`
// growth. Serving both would mean four new props for one caller, which §1 bans
// twice over. What they genuinely share is `plateOn` picking ink that survives
// the fill, and that was already extracted.
//
// `minHeight: 0` INLINE, because `desk.css` is unlayered and beats
// `@layer utilities`: `.cm-titlebar` grows to 96px above `lg` on the argument
// that a bar is 3.3x a row on a 1440 SCREEN, and these sit on panels 352–384px
// wide at every width. `lg:min-h-0` was written first and lost silently.

export default function DialogHead({
  title,
  club,
}: {
  /** The subject's name. A string, because a bar holds one thing. */
  title: string;
  /** His club's short name, for the plate. Null where there is no club to take
   *  a colour from — a roster slot the bridge could not settle — and then the
   *  bar keeps the desk's chrome blue, which is what every unplated bar wears. */
  club: string | null;
}) {
  const plate = club === null ? undefined : plateOn(clubColours(club));

  return (
    <div
      className="cm-titlebar flex items-center px-3 py-2"
      style={{ minHeight: 0, ...(plate ? { background: plate.background } : {}) }}
    >
      <h2
        className="cm-title min-w-0 flex-1 truncate text-xl font-bold tracking-tight"
        style={plate ? { color: plate.ink } : undefined}
      >
        {title}
      </h2>
    </div>
  );
}
