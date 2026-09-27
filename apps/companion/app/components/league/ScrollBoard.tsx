"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { SCROLL } from "@/app/desk";
import { pinHead } from "./stickyHead";

/** A board that scrolls sideways, and says so under a thumb: a fade at the edge while there is more, a gauge docked
 *  above the rail, a shadow on the pinned lead once scrolled, its head pinned to the top of a long board
 *  (`desk.css`, `.cm-board`). `className` and `style` go on the scroller (a ground, an index scope). */
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
  const strip = useRef<HTMLDivElement>(null);

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
    const unpin = strip.current === null ? () => {} : pinHead(board, box, strip.current);
    return () => {
      box.removeEventListener("scroll", queue);
      sizes.disconnect();
      cancelAnimationFrame(queued);
      unpin();
    };
  }, []);

  return (
    <div ref={frame} className="cm-board relative">
      <div aria-hidden className="cm-board-head">
        <div ref={strip} className={className} style={style} />
      </div>
      <span aria-hidden className="cm-board-fade" />
      <div ref={scroller} className={`${SCROLL} cm-scroll ${className}`} style={style}>
        {children}
      </div>
      <span aria-hidden className="cm-board-gauge" />
    </div>
  );
}
