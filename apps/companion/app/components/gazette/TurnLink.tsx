"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, type ReactNode } from "react";

// A link that turns the page.
//
// **Why not React's <ViewTransition>:** it ships only in React's experimental
// channel — `unstable_ViewTransition` is absent from the runtime of the React
// this app pins (19.2.4), and Next's `experimental.viewTransition` flag only
// enables the integration for a React that has it. Moving the whole app onto an
// experimental React to animate a page turn is not a trade worth making. The
// browser's own View Transitions API is baseline, needs no dependency
// (CODE_RULES §2), and is what that React component wraps anyway.
//
// The whole mechanism: intercept the click, navigate inside
// `document.startViewTransition`, and let `paper.css` animate the two
// snapshots the browser takes either side of it. A browser without the API
// takes the untouched `<Link>` path, and so does anyone who has asked for
// reduced motion — checked here as well as in the stylesheet, because not
// starting a transition at all is stiller than starting one that animates to
// nothing.
//
// **THE TURN IS HELD UNTIL THE NEW PAGE IS THERE, and not doing that is why
// Craig's verdict was that the turn "sucks on chrome".** It used to call
// `router.push(href)` straight inside the transition callback. That returns
// before the new route has rendered, so the browser took its "new" snapshot of
// whatever was on screen at that instant — which for a suspending route is
// `(paper)/loading.tsx`. The animation was therefore the front page fading into
// a grey skeleton, every time, and the real page appeared afterwards with no
// transition at all. Caught by slowing the keyframes and photographing the
// middle of it; at 200ms it reads as a flicker rather than as a wrong picture,
// which is exactly the kind of bug a screenshot finds and a diff does not.
//
// Two pieces fix it. The push goes inside React's `startTransition`, so the
// router keeps the OLD tree on screen until the new one is ready instead of
// falling back to the loading skeleton. And the callback returns a promise that
// is resolved from an effect on `usePathname`, so the browser takes its second
// snapshot after the new route has committed.
//
// The wait is BOUNDED. A view transition holds the page frozen under its
// snapshot while the callback is pending, so a navigation that never commits
// would freeze the paper — the timeout resolves the transition and lets the
// animation run against whatever is there, which is the old behaviour rather
// than a locked page. It is not a swallowed failure (CODE_RULES §2): nothing is
// caught and nothing is defaulted, the animation simply stops waiting.
//
// It is the paper's ONLY client component. Everything that renders words stays
// a server component; this renders its children and an onClick.

/** How long the turn waits for the new page before animating anyway. Half a
 *  second: a paper route is server-rendered and cached, so it commits in tens
 *  of milliseconds, and the only thing this bounds is the pathological case
 *  where it never does. */
const SETTLE_MS = 500;

export default function TurnLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  /** The held transition's resolver, while a turn is in flight. */
  const settle = useRef<(() => void) | null>(null);

  // The new route has committed, so the browser may take its second snapshot.
  // Keyed on the pathname and not on a router event, because the pathname
  // changing IS the commit — there is no earlier signal that the tree is the
  // new one.
  useEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        // Never swallow the gestures that mean "not here": a modified click is
        // a new tab, and a middle click is too.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        const start = (
          document as Document & { startViewTransition?: (cb: () => void) => void }
        ).startViewTransition;
        if (typeof start !== "function") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        event.preventDefault();
        // The flag the stylesheet keys on, set for the length of the turn and
        // cleared after: a view-transition pseudo-element is document-level, so
        // an attribute is the only scope available to keep the paper's leaf off
        // any transition the desk might one day start.
        const root = document.documentElement;
        root.dataset.turning = "";
        const transition = start.call(document, () => {
          return new Promise<void>((resolve) => {
            const done = () => {
              settle.current = null;
              clearTimeout(timer);
              resolve();
            };
            const timer = setTimeout(done, SETTLE_MS);
            settle.current = done;
            // Inside React's transition, so the router holds the old tree on
            // screen until the new one is ready rather than dropping to the
            // loading skeleton — which is the picture the turn used to animate
            // to.
            startTransition(() => {
              router.push(href);
            });
          });
        }) as { finished?: Promise<void> } | undefined;
        void Promise.resolve(transition?.finished).finally(() => {
          delete root.dataset.turning;
        });
      }}
    >
      {children}
    </Link>
  );
}
