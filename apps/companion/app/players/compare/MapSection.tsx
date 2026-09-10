import type { TouchPlayer } from "@epl/core";
import { touchFixtures, touchesOf } from "@epl/core";
import Section from "../../components/shell/Section";
import PlayerMap from "./PlayerMap";

// The maps, both men, one section.
//
// **No map picker yet, and that is the rule rather than an omission.**
// `docs/ui/compare.md` records it: the picker is to be built from the kinds the
// file actually carries, never from a list of its own, because a control
// offering a map with nothing behind it is worse than no control. One kind is
// exported today, so a picker would be a single plate that does nothing. It
// arrives with the shots, and the kinds present are what fill it.
//
// **Season, not per fixture, and that is also about the data.** Touches carry
// `fplFixtureId` so a per-match filter is free whenever it is wanted — but five
// rounds in, a man's single match is about forty-six touches, which is a
// scattering rather than a shape. The filter is worth building when there is
// enough behind each option to be worth choosing.

/** One man, as this section needs him. Not exported: the page passes a literal
 *  and structural typing checks it. */
interface Man {
  name: string;
  /** His touches, or undefined for a man the SofaScore bridge has not settled
   *  and for a man who has not played. The map says the same thing either way,
   *  because from a reader's side they are the same fact. */
  touches: TouchPlayer | undefined;
}

export default function MapSection({ a, b }: { a: Man; b: Man }) {
  const maps = [
    { side: "a", man: a },
    { side: "b", man: b },
  ] as const;

  // Nothing to draw for either of them is not an empty section — it is no
  // section. Two blank pitches under a heading claim a comparison was made.
  if (a.touches === undefined && b.touches === undefined) return null;

  return (
    <Section title="Where they played" aside="Every touch, this season">
      <div className="grid gap-3 lg:grid-cols-2">
        {maps.map(({ side, man }) => (
          <PlayerMap
            key={side}
            id={side}
            name={man.name}
            touches={touchesOf(man.touches, null)}
            matches={touchFixtures(man.touches).length}
          />
        ))}
      </div>
      {/* Said once, off the pitches, because it is true of both and printing an
          arrow on each is the same fact twice. */}
      <p className="mt-1.5 text-3xs text-faint">
        Both attack to the right. Each map is shaded against that man&rsquo;s own busiest
        area, so the two show shape rather than volume — the counts above them are the
        volume.
      </p>
    </Section>
  );
}
