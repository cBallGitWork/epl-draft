import type { PublishedStory } from "@epl/core";

// The week's quiz, with the answers printed upside down.
//
// A newsprint gag that costs nothing and only works on paper: a rotation and a
// faint ink, so the answers are there, on the page, and mildly annoying to
// read — which is the entire joke. Nothing is hidden and nothing is
// interactive; a screen reader gets the answers in the ordinary reading order
// because upside down is a visual joke and not a puzzle to be enforced.

export default function Quiz({ story }: { story: PublishedStory }) {
  const quiz = story.extras?.quiz ?? [];
  if (quiz.length === 0) return null;

  return (
    <section className="pt-3">
      <p className="border-b border-line pb-1 font-sans text-3xs font-bold uppercase tracking-[0.16em] text-faint">
        The quiz
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-4 pt-2 text-sm text-ink">
        {quiz.map((item, at) => (
          <li key={at}>{item.q}</li>
        ))}
      </ol>
      <p className="pt-3 font-sans text-3xs uppercase tracking-[0.16em] text-faint">Answers</p>
      <ol
        className="flex list-decimal flex-col gap-0.5 pl-4 pt-1 text-2xs text-faint"
        // The gag itself. `inline-size` keeps the rotated block inside the
        // column rather than spilling into the gutter.
        style={{ transform: "rotate(180deg)", transformOrigin: "center" }}
      >
        {quiz.map((item, at) => (
          <li key={at}>{item.a}</li>
        ))}
      </ol>
    </section>
  );
}
