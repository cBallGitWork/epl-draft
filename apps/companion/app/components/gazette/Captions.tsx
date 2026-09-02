import type { PublishedStory } from "@epl/core";

// The selector's verdict on each man he picked.
//
// The front page already prints these — `TeamOfTheWeek` in the sidebar takes
// them as a `Map` and hangs each line under its man. This is the same lines on
// the article page, where the sidebar is not: without it the team-of-the-week
// column turns to a page that prints the argument and silently drops the side
// it is arguing about.
//
// A list and not the sidebar's eleven-shaped column: the pitch shape belongs
// beside the lead, and repeating it under the prose that discusses it would be
// the same object twice on one page. Here the man is the standing head and the
// verdict is the line, which is how a paper captions a team it has picked.

export default function Captions({ story }: { story: PublishedStory }) {
  const captions = story.extras?.captions ?? [];
  if (captions.length === 0) return null;

  return (
    <dl className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {captions.map((caption) => (
        <div key={caption.key} className="py-2">
          <dt className="font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-ink">
            {caption.key}
          </dt>
          <dd className="pt-0.5 text-sm leading-relaxed text-ink">{caption.line}</dd>
        </div>
      ))}
    </dl>
  );
}
