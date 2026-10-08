// A long board's head row, copied into a strip pinned to the top of the screen while the real one is scrolled away.
// A head inside a sideways scroller cannot stick to the page (the scroller is its sticky container), so a copy
// stands outside it: cell widths copied from the real head, its own scroll kept level with the board's.

/** Pins a copy of `box`'s `<thead>` in `strip`; returns the teardown. A board with no head gets nothing. */
export function pinHead(board: HTMLElement, box: HTMLElement, strip: HTMLElement): () => void {
  const table = box.querySelector("table");
  const head = table?.querySelector("thead");
  if (table === null || table === undefined || head === null || head === undefined) return () => {};

  const copy = document.createElement("table");
  strip.replaceChildren(copy);

  const size = () => {
    copy.className = table.className;
    copy.style.width = `${table.getBoundingClientRect().width}px`;
    copy.style.tableLayout = "fixed";
    const real = head.querySelectorAll("th");
    copy.querySelectorAll("th").forEach((cell, at) => {
      const width = `${real[at]?.getBoundingClientRect().width ?? 0}px`;
      cell.style.width = width;
      cell.style.minWidth = width;
      cell.style.maxWidth = width;
    });
  };

  const clone = () => {
    const twin = head.cloneNode(true) as HTMLElement;
    twin.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    twin.querySelectorAll("a, button").forEach((node) => node.setAttribute("tabindex", "-1"));
    copy.replaceChildren(twin);
    size();
  };

  let queued = 0;
  const place = () => {
    queued = 0;
    const top = head.getBoundingClientRect();
    const end = table.getBoundingClientRect().bottom;
    board.toggleAttribute("data-headless", top.bottom < 0 && end > top.height * 2);
    strip.scrollLeft = box.scrollLeft;
  };
  const queue = () => {
    if (queued === 0) queued = requestAnimationFrame(place);
  };

  clone();
  place();
  const press = forwardTaps(copy, head);
  strip.addEventListener("click", press);
  const edits = new MutationObserver(clone);
  edits.observe(head, { subtree: true, childList: true, attributes: true, characterData: true });
  const sizes = new ResizeObserver(() => {
    size();
    queue();
  });
  sizes.observe(table);
  window.addEventListener("scroll", queue, { passive: true });
  box.addEventListener("scroll", queue, { passive: true });

  return () => {
    edits.disconnect();
    sizes.disconnect();
    window.removeEventListener("scroll", queue);
    box.removeEventListener("scroll", queue);
    strip.removeEventListener("click", press);
    cancelAnimationFrame(queued);
    strip.replaceChildren();
  };
}

/** A tap on the copy presses the same plate on the real head: a clone has none of React's handlers, so its link
 *  would load the whole page and its button do nothing. A modified tap is left to open the link in a new tab. */
export function forwardTaps(copy: ParentNode, real: ParentNode): (event: MouseEvent) => void {
  return (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const plate = (event.target as Element | null)?.closest?.("a, button") ?? null;
    const at = plate === null ? -1 : [...copy.querySelectorAll("a, button")].indexOf(plate);
    const twin = real.querySelectorAll<HTMLElement>("a, button")[at];
    if (twin === undefined) return;
    event.preventDefault();
    twin.click();
  };
}
