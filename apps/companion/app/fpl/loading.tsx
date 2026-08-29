import PageHeader from "../components/shell/PageHeader";
import Section from "../components/shell/Section";
import Skeleton from "../components/shell/Skeleton";

// The other game, waiting on FPL.
//
// Drawn as the signed-in tab rather than as the entry form: reading the cookie
// costs nothing and the form paints with it, so the only arrival this frame is
// ever on screen for is the one that has an entry id and is fetching a side.

/** The three figures across the top, in their printed order. Their labels are
 *  this page's own chrome, not FPL's answer, so they are here rather than
 *  standing in as blocks. */
const FIGURES = ["Overall", "Rank", "Round"];

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <PageHeader title="FPL" sub={<Skeleton width="8rem" height="0.75rem" />} />

      <dl className="grid grid-cols-3 gap-1.5">
        {FIGURES.map((label) => (
          <div key={label} className="elev rounded-xl border border-line bg-surface px-3 py-2">
            <dt className="text-2xs font-bold uppercase tracking-widest text-faint">{label}</dt>
            <dd>
              <Skeleton width="3.5rem" height="1.75rem" />
            </dd>
          </div>
        ))}
      </dl>

      {/* The round number joins the heading when the side lands; the word is on
          screen from the start so the section does not appear from nothing. */}
      <Section title="Gameweek" aside={<>FPL&apos;s scoring</>}>
        <Skeleton width="100%" height="17rem" />
      </Section>
    </div>
  );
}
