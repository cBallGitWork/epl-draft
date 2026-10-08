"use client";

import Link from "@/app/components/shell/Link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, type ReactNode } from "react";

// A link that turns the page with the browser's View Transitions API (React's <ViewTransition> is experimental-only).
// The push runs in `startTransition` and the snapshot waits for the pathname to change, so the turn lands on the new
// page; without the API, or under reduced motion, it is a plain `<Link>`.

/** How long the turn waits for the new page before animating anyway, so a navigation that never commits cannot freeze it. */
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

  // The pathname changing is the commit, so the browser may take its second snapshot.
  useEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        // A modified or middle click is a new tab.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        const start = (
          document as Document & { startViewTransition?: (cb: () => void) => void }
        ).startViewTransition;
        if (typeof start !== "function") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        event.preventDefault();
        // `paper.css` keys the leaf on this, since a view-transition pseudo-element is document-level.
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
            // Holds the old tree on screen until the new page commits.
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
