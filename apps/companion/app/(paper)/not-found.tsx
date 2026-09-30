import Link from "next/link";
import { PAPER_NAME } from "../config";
import { STANDING_HEAD } from "../components/gazette/heads";

// A 404 inside the paper, set in the paper.
//
// It lives in the route group so it inherits `.paper` and the serifs: a story
// whose slug has gone must not answer in desk chrome, which would tell a reader
// the app broke rather than that the edition moved on.

export default function NotFound() {
  return (
    <div className="flex flex-col">
      <div className="h-[3px] bg-current" />
      <p className={`pt-3 ${STANDING_HEAD}`}>
        {PAPER_NAME}
      </p>
      <h1 className="paper-display pt-2 text-4xl font-black leading-[1.02] text-ink">
        Not in this edition
      </h1>
      <p className="pt-2 text-lg italic leading-snug text-muted">
        The story you asked for is not in the paper we are holding.
      </p>
      <span className="mt-3 block h-px w-6 bg-ink" />
      <p className="pt-3">
        <Link href="/" className="flex min-h-11 items-center font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-accent">
          The front page
        </Link>
      </p>
    </div>
  );
}
