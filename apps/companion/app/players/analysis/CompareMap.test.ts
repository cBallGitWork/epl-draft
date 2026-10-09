import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import CompareMap from "./CompareMap";

vi.mock("@/app/desk", () => import("../../desk"));

/** Every list of siblings in a tree that repeats a key: React drops or doubles one of each pair. */
function repeatedKeys(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    const keys = node.flatMap((child) => (isValidElement(child) && child.key !== null ? [child.key] : []));
    const repeated = keys.filter((key, at) => keys.indexOf(key) !== at);
    return [...repeated, ...node.flatMap(repeatedKeys)];
  }
  if (!isValidElement(node)) return [];
  return repeatedKeys((node.props as { children?: ReactNode }).children);
}

describe("CompareMap", () => {
  it("keys each man apart when two share a name", () => {
    // Web names are not unique: two Wilsons, two Johnsons, two Gomes.
    const map = CompareMap({
      men: [
        { name: "Wilson", club: undefined, shots: [] },
        { name: "Wilson", club: undefined, shots: [] },
      ],
      passes: true,
      window: "this season",
    });
    expect(repeatedKeys(map)).toEqual([]);
  });
});
