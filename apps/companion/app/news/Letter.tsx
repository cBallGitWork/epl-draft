import type { InboxItem } from "@epl/core";
import { fantraxMoment, londonDayAndDate, londonTime } from "@epl/core";
import { LABEL } from "@/app/desk";

// The item you are reading, as a letter.
//
// **Its own file because `page.tsx` went past CODE_RULES §4's ceiling** — 348
// lines, in the same change that split `items.ts` at 320 citing that ceiling by
// name. A rule applied to the package and not to the app is not a rule. This is
// the half that comes off cleanly: the route resolves the inbox and picks the
// open item, and this draws it. It knows nothing about routing or selection.

/** The item you are reading: its headline in CM's yellow, and the body under it.
 *
 *  Inside a panel, which is where `cm9900/24.jpg` puts a yellow caption and
 *  where DESIGN §2 requires anything printed at all — the reference's own news
 *  screen sets both straight on the photograph, and that is the one thing in the
 *  shot we do not copy. */
export default function Letter({ item }: { item: InboxItem }) {
  const moment = itemMoment(item);
  return (
    <article className="cm-panel flex flex-col p-3 lg:min-h-[22rem] lg:p-5">
      {/* **A letter's own head, and it is three facts rather than a caption**
          (Craig, 17 Sep 2026: *"lets make this sound like a real email"*, and
          *"email box can use more space, should look more like an email too?"*).

          What was here was a centred yellow headline, a sentence and a greyed
          date at the foot — a caption over a paragraph, which is the shape of a
          news item and not of post. Every mail client ever written opens with
          the same three lines, in the same order, and they are all facts this
          item already carried: who it is from, what it is about, when it came.
          The date moved from the bottom to the top for that reason, and stopped
          being the thing a reader skips.

          `from` is the field doing the most work: it is where a doubt says whose
          man he is, and the one place the opponent is named AS the opponent. */}
      <header className="flex flex-col gap-2 border-b border-line pb-3">
        <Field label="From">{item.from}</Field>
        {/* CM's yellow, still — it is the subject line of the letter and the
            caption of the screen, and `02-news.jpg` sets it in the accent. Left
            rather than centred now that it is a FIELD with a label beside it. */}
        {/* **The `h2` IS the field's value, not a block inside it.** It was
            wrapped in `Field`'s own `<span>` — a block child of an inline
            element, which is an invalid content model and, more visibly, gave
            `items-baseline` a block to align two inline labels against. Subject
            sat off the baseline the head is built on. `Field` takes the element
            now and the heading carries the row's own text size. */}
        <Field label="Subject" as="h2" accent>
          {item.headline}
        </Field>
        {moment === null ? null : <Field label="Date">{moment}</Field>}
        {/* **Only when the sender does not already say it.** "The FA" and "The
            transfer desk" belong to no club, so on those two this is the only
            line that names the squad — and it names the opponent AS the
            opponent, which is Craig's *"make it clear its their team too"*. */}
        {item.about === null ? null : <Field label="Squad">{item.about}</Field>}
      </header>
      {/* **Room to be a letter.** `leading-relaxed` and a real top margin: the
          body is one or two sentences and it was set tight under a centred
          caption, which reads as a caption's second line rather than as the
          thing you opened. */}
      <p className="pt-3 text-sm leading-relaxed text-ink lg:pt-4 lg:text-base">{item.body}</p>
    </article>
  );
}

/** One line of the letter's head: a label in the quiet slot, then the fact.
 *
 *  The label column is FIXED so the values line up — a head whose values start
 *  at four different x-positions is four captions rather than a block, and the
 *  alignment is the whole visual argument that this is post.
 *
 *  **`as` exists so the Subject can be the heading it already was** without a
 *  block element inside the value's span. Everything the head holds is one line
 *  of text; the only question is which element says it. */
function Field({
  label,
  children,
  as: Tag = "span",
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  as?: "span" | "h2";
  /** CM's yellow, for the Subject — DESIGN §3 gives the accent to the SELECTED
   *  thing, and the letter is the one item on the screen that is.
   *
   *  **A flag and not a `className`**, which is what this took for one commit
   *  and is a trap Tailwind sets for anyone composing a class string: a passed
   *  `text-accent` and the base's own `text-ink` are utilities of equal
   *  specificity, so the winner is whichever sits later in the GENERATED sheet,
   *  not whichever sits later in the string. `text-ink` won and the Subject went
   *  white. A boolean picks one of the two and they never both appear. */
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${LABEL} w-12 shrink-0 lg:w-16`}>{label}</span>
      <Tag
        className={`min-w-0 flex-1 text-sm lg:text-base ${
          accent ? "cm-title font-chrome font-bold text-accent lg:text-lg" : "text-ink"
        }`}
      >
        {children}
      </Tag>
    </div>
  );
}

/** The same date with its clock, for the item being read. Fantrax's carries the
 *  zone on its face (`Wed 2 Sep, 6:11 AM ET`) because we did not convert it. */
function itemMoment(item: InboxItem): string | null {
  if (item.at === null) return null;
  if ("iso" in item.at) return `${londonDayAndDate(item.at.iso)}, ${londonTime(item.at.iso)}`;
  return fantraxMoment(item.at.fantrax);
}
