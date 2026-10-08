import { describe, expect, it, vi } from "vitest";
import { forwardTaps } from "./stickyHead";

// Just enough of a head row: its plates in document order, each pressable.
function head(plates: number) {
  const list = Array.from({ length: plates }, () => ({ click: vi.fn() }));
  return { list, root: { querySelectorAll: () => list } as unknown as ParentNode };
}

/** A tap whose target sits inside `plate` (null: on no plate at all), with the modifier keys given. */
function tap(plate: unknown, keys: Partial<MouseEvent> = {}) {
  return { target: { closest: () => plate }, preventDefault: vi.fn(), ...keys } as unknown as MouseEvent;
}

describe("forwardTaps", () => {
  it("presses the real head's plate for the copy's, and stops the copy's own link", () => {
    const copy = head(3);
    const real = head(3);
    const event = tap(copy.list[1]);
    forwardTaps(copy.root, real.root)(event);
    expect(real.list.map((plate) => plate.click.mock.calls.length)).toEqual([0, 1, 0]);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does nothing for a tap on no plate, such as the bare name cell", () => {
    const real = head(3);
    const event = tap(null);
    forwardTaps(head(3).root, real.root)(event);
    expect(real.list.some((plate) => plate.click.mock.calls.length > 0)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("leaves a modified tap to the browser, which opens the copy's link in a new tab", () => {
    const copy = head(3);
    const real = head(3);
    const event = tap(copy.list[0], { metaKey: true });
    forwardTaps(copy.root, real.root)(event);
    expect(real.list[0]?.click).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
