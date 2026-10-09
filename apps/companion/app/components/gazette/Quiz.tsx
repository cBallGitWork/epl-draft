import type { PublishedStory } from "@epl/core";
import { KICKER_CAPS, QUIET_CAPS } from "./heads";

// The week's quiz, the answers printed upside down: a visual joke, so a screen reader reads them in order.

export default function Quiz({ story }: { story: PublishedStory }) {
  const quiz = story.extras?.quiz ?? [];
  if (quiz.length === 0) return null;

  return (
    <section className="pt-3">
      <p className={`${KICKER_CAPS} border-b border-line pb-1 text-faint`}>
        The quiz
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-4 pt-2 text-sm text-ink">
        {quiz.map((item, at) => (
          <li key={at}>{item.q}</li>
        ))}
      </ol>
      <p className={`${QUIET_CAPS} pt-3`}>Answers</p>
      <ol
        className="flex list-decimal flex-col gap-0.5 pl-4 pt-1 text-2xs text-faint"
        // The gag itself.
        style={{ transform: "rotate(180deg)", transformOrigin: "center" }}
      >
        {quiz.map((item, at) => (
          <li key={at}>{item.a}</li>
        ))}
      </ol>
    </section>
  );
}
