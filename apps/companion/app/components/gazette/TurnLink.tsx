"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

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
// The whole mechanism: intercept the click, run `router.push` inside
// `document.startViewTransition`, and let `paper.css` animate the two
// snapshots the browser takes either side of it. A browser without the API
// takes the untouched `<Link>` path, and so does anyone who has asked for
// reduced motion — checked here as well as in the stylesheet, because not
// starting a transition at all is stiller than starting one that animates to
// nothing.
//
// It is the paper's ONLY client component. Everything that renders words stays
// a server component; this renders its children and an onClick.

export default function TurnLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page";
  id?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      {...rest}
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
          router.push(href);
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
