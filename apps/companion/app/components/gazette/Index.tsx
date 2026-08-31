import Link from "next/link";
import { SECTIONS } from "../shell/sections";

// The paper's contents strip: where else in the app to go, printed.
//
// The desk's rail stands down on the front page — a 64px navy column beside a
// broadsheet is a seam, and it would narrow the container the two-column layout
// keys off — so the paper carries the same bones in its own register. Same six
// sections, same table (`shell/sections.ts`), same gate on Live; letterspaced
// small capitals between two hairlines instead of a stack of bevelled plates.
// That is what DESIGN §1 means by one skeleton and two registers, and it is the
// difference between the front page being the other register and the front page
// being a dead end.
//
// Archivo and not the body serif, on §6's rule: a serif at nine pixels with
// 0.16em of tracking is a smudge, and an index is furniture rather than prose.

/** The route this strip is printed on, and therefore the one it marks. A server
 *  component on exactly one page does not need `usePathname` to know where it
 *  is. */
const HERE = "/";

export default function Index({ matchday }: { matchday: boolean }) {
  const sections = SECTIONS.filter((section) => matchday || !section.onlyDuringGameweek);

  return (
    <nav
      aria-label="Sections"
      // No `py-` on the strip: the links carry their own `min-h-11` and the
      // padding would stack on top of it. They are the front page's only way
      // into the rest of the app, and they shipped as 12px targets — measured by
      // `tools/ui/tapfit.mjs`, which is why that instrument exists.
      className="flex flex-wrap items-center justify-between gap-x-3 border-y border-line font-sans text-3xs font-semibold uppercase tracking-[0.16em]"
    >
      {sections.map((section) => {
        const here = section.href === HERE;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={here ? "page" : undefined}
            // The sheet's one red is the accent slot on the paper, and "where
            // you are" is what the accent says in both registers.
            className={`flex min-h-11 items-center ${here ? "text-accent" : "text-muted"}`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
