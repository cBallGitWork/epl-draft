import Link from "next/link";
import type { Shot, TouchPlayer } from "@epl/core";
import { shotsOf, touchFixtures, touchesOf } from "@epl/core";
import Section from "../../components/shell/Section";
import PlayerMap from "./PlayerMap";
import { MarksKey } from "../../components/football/ShotMarks";
import { MAP_LABEL, chosenKind, kindsPresent } from "./maps";
import { PLATE } from "../BoardControls";

// The maps, and the control that chooses which one.
//
// Craig, 10 Sep 2026: *"need options for touch map, shot map etc"*. It shipped
// with the SECOND kind and not the first, which was the rule rather than a
// delay: it is built from the kinds actually present, so with only touches
// exported it would have been a single plate to choose between — furniture, not
// a control.
//
// **"Action Zones", which is Championship Manager's own name for this.**
// `cm9900/16.jpg` and `22.jpg` run `Match Overview · Match Stats · Action Zones ·
// Match Report`, and `docs/ui/match.md` has listed Action Zones for weeks as one
// of the two tabs the game has and we do not — `intel-export.md` calls it "the
// Action Zones gap" in as many words. This is that gap closed, under the game's
// own heading (Craig, 10 Sep 2026: *"replace with something more CM"*). It read
// "Maps", which was ours and described the picture rather than the reading.
//
// **A segmented strip and not chips**, which is a semantic choice rather than a
// visual one. `docs/ui/players.md` records the ruling: a Championship Manager
// tab strip picks ONE of a set and marks exactly one plate current, and six blue
// plates with any number lit is a strip making a claim it cannot keep. A map is
// one at a time, so it is `cm-tab cm-tab-quiet` with `aria-current`.
//
// **A URL parameter and a `<Link>`, never React state** — every other filter in
// this app is, so that the page needs no script and a chosen map is a link
// somebody can send.
//
// **Both men always draw the SAME map.** Two pitches on two different kinds is
// not a comparison, so the picker is one control above both rather than one
// each.

/** One man, as this section needs him. Not exported: the page passes a literal
 *  and structural typing checks it. */
interface Man {
  name: string;
  /** Undefined for a man the SofaScore bridge has not settled, and for a man who
   *  has not played. The map says the same thing either way, because from a
   *  reader's side they are the same fact. */
  touches: TouchPlayer | undefined;
  shots: readonly Shot[];
}

export default function MapSection({
  a,
  b,
  asked,
  href,
}: {
  a: Man;
  /** Null when one man is being looked at on his own. */
  b: Man | null;
  /** What the URL asked for, which may be a kind neither man has. */
  asked: string | undefined;
  /** Where a plate points, given a kind. The page owns the rest of the query. */
  href: (kind: string) => string;
}) {
  const men = b === null ? [a] : [a, b];
  const present = kindsPresent(men);
  const kind = chosenKind(asked, present);

  // Nothing to draw is not an empty section — it is no section. A blank pitch
  // under a heading claims a map was made.
  if (kind === null) return null;

  return (
    // **The head does not name the map, because the picker under it does.**
    // Titling it "Shot map" over a plate reading "Shot map" is the duplication
    // Craig struck off the search boxes on the same day — a heading repeating
    // the control beneath it. Where there is no picker (one kind present) the
    // caption at the foot still says which map it is.
    <Section title="Action Zones" aside="This season">
      {/* One plate is nothing to choose between, so the strip appears with the
          second kind and not before. */}
      {present.length > 1 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {present.map((each) => (
            <Link
              key={each}
              href={href(each)}
              aria-current={each === kind ? "page" : undefined}
              // **`scroll={false}`, or the picker throws the reader back to the
              // top of the page** (Craig, 10 Sep 2026: *"everytime you touch
              // touch/shot map you go back to the top of the page"*). Next
              // scrolls to the top on every navigation by default, which is
              // right for a link to somewhere ELSE and wrong for a control that
              // changes one panel in place — the maps sit well below the fold,
              // so choosing one scrolled the thing you chose off the screen.
              // `Search.tsx` and `PickField` already pass the same flag to
              // `router.replace` for the same reason.
              scroll={false}
              className={`cm-tab cm-tab-quiet ${PLATE}`}
            >
              {MAP_LABEL[each]}
            </Link>
          ))}
        </div>
      ) : null}

      {/* One man takes half the width on a desk rather than the whole of it: a
          pitch stretched to 1090px is one nobody can take in at a glance, and
          the shape of a map is read all at once or not at all. */}
      <div className="grid gap-3 lg:grid-cols-2">
        {men.map((man, n) => (
          <PlayerMap
            key={n === 0 ? "a" : "b"}
            id={n === 0 ? "a" : "b"}
            kind={kind}
            name={man.name}
            touches={touchesOf(man.touches, null)}
            shots={shotsOf(man.shots as Shot[], null)}
            matches={touchFixtures(man.touches).length}
          />
        ))}
      </div>

      {/* **No prose line under the maps** (Craig, 10 Sep 2026: *"remove this
          row"*). What it was doing is now done by the things themselves: the
          direction by a faint arrow ON each pitch, and the shot encoding by a
          key drawn from the same numbers the marks are. Neither is a sentence
          about a picture sitting under the picture. */}
      {kind === "shots" ? (
        <div className="mt-1.5">
          <MarksKey />
        </div>
      ) : null}
    </Section>
  );
}
