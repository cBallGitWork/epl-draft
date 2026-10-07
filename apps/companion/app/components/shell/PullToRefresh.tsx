"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Glyph from "./glyphs";
import { armed, intent, pullDistance } from "./pull";
import { PULL } from "../../config";

// Pull down from the top of a page to reload it, as a browser's own pull does, in the installed app only: a browser
// tab has its own, and the home-screen app (`display: standalone`) has none.

/** Whether the app was opened from the home screen: iOS says so on `navigator`, everything else by media query. */
function installed(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Whether a touch here belongs to something that scrolls on its own: a dialog, or a scrolled sheet or panel. */
function ownScroll(target: EventTarget | null): boolean {
  if (document.querySelector("dialog[open]") !== null) return true;
  for (let node = target instanceof Element ? target : null; node !== null; node = node.parentElement) {
    if (node.scrollTop > 0) return true;
  }
  return false;
}

export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [reloading, setReloading] = useState(false);
  const pulled = useRef(0);

  useEffect(() => {
    if (!installed()) return;
    let start: { x: number; y: number } | null = null;
    let read: "pull" | "other" | null = null;
    const show = (value: number) => {
      pulled.current = value;
      setDistance(value);
    };
    const begin = (event: TouchEvent) => {
      const touch = event.touches[0];
      const free = event.touches.length === 1 && window.scrollY <= 0 && !ownScroll(event.target);
      start = free ? { x: touch.clientX, y: touch.clientY } : null;
      read = null;
    };
    const move = (event: TouchEvent) => {
      if (start === null) return;
      const touch = event.touches[0];
      const dy = touch.clientY - start.y;
      read ??= intent(touch.clientX - start.x, dy, PULL);
      if (read === null) return;
      // A sideways swipe, or a page that has started to scroll, lets the gesture go for good.
      if (read === "other" || window.scrollY > 0) {
        start = null;
        return show(0);
      }
      show(pullDistance(dy, PULL));
    };
    const end = () => {
      if (start !== null && armed(pulled.current, PULL)) {
        setReloading(true);
        location.reload();
      }
      start = null;
      show(0);
    };
    const cancel = () => {
      start = null;
      show(0);
    };
    window.addEventListener("touchstart", begin, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", cancel);
    return () => {
      window.removeEventListener("touchstart", begin);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", cancel);
    };
  }, []);

  // Held at the arm distance, turning, until the reloaded page replaces this one.
  const shown = reloading ? PULL.arm : distance;
  if (shown === 0) return null;
  const ready = armed(shown, PULL);
  return (
    <div
      aria-hidden
      className="cm-pull"
      data-refreshing={reloading || undefined}
      style={{ "--pull": `${shown}px`, "--turn": `${(shown / PULL.arm) * 270}deg` } as CSSProperties}
    >
      {/* Raised while it would do nothing, pressed once letting go reloads: DESIGN §2's plate grammar. */}
      <span className={`${ready ? "cm-bevel-pressed" : "cm-bevel"} flex min-h-11 items-center gap-2 px-3`}>
        <Glyph name="refresh" />
        <span className="whitespace-nowrap text-xs font-semibold leading-4">
          {reloading ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}
        </span>
      </span>
    </div>
  );
}
