"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { SCROLL } from "@/app/desk";

/** A board that scrolls sideways, and says so under a thumb: a fade and ▶ at the edge while there is more, a gauge
 *  pinned above the rail, a shadow on the pinned lead once scrolled (`desk.css`, `.cm-board`). iOS draws no bar for
 *  `.cm-scroll`, so these are drawn. `className` and `style` go on the scroller (a ground, an index scope). */
export default function ScrollBoard({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = frame.current;
    const box = scroller.current;
    if (board === null || box === null) return;
    let queued = 0;
    const read = () => {
      queued = 0;
      const spare = box.scrollWidth - box.clientWidth;
      board.toggleAttribute("data-wide", spare > 1);
      board.toggleAttribute("data-more", spare > 1 && box.scrollLeft < spare - 1);
      board.toggleAttribute("data-scrolled", box.scrollLeft > 1);
      board.style.setProperty("--gauge-width", `${(box.clientWidth / box.scrollWidth) * 100}%`);
      board.style.setProperty("--gauge-left", `${(box.scrollLeft / box.scrollWidth) * 100}%`);
    };
    const queue = () => {
      if (queued === 0) queued = requestAnimationFrame(read);
    };
    read();
    box.addEventListener("scroll", queue, { passive: true });
    const sizes = new ResizeObserver(queue);
    sizes.observe(box);
    if (box.firstElementChild !== null) sizes.observe(box.firstElementChild);
    return () => {
      box.removeEventListener("scroll", queue);
      sizes.disconnect();
      cancelAnimationFrame(queued);
    };
  }, []);

  return (
    <div ref={frame} className="cm-board relative">
      <span aria-hidden className="cm-board-fade" />
      <div ref={scroller} className={`${SCROLL} cm-scroll ${className}`} style={style}>
        {children}
      </div>
      <span aria-hidden className="cm-board-gauge" />
    </div>
  );
}
