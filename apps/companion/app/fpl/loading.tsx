import PageHeader from "../components/shell/PageHeader";
import Section from "../components/shell/Section";
import Skeleton from "../components/shell/Skeleton";
import { LABEL } from "@/app/desk";

// The FPL tab waiting on FPL, drawn as the side: the entry form never waits, so only a saved id sees this.

/** The figures across the top; must match `page.tsx`'s two, or the frame shows a panel the answer does not fill. */
const FIGURES = ["This week", "Rank"];

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <PageHeader title="FPL" sub={<Skeleton width="8rem" height="0.75rem" />} />

      <dl className="grid grid-cols-2 gap-1.5">
        {FIGURES.map((label) => (
          <div key={label} className="cm-panel px-3 py-2">
            <dt className={LABEL}>{label}</dt>
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
