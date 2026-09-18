import { describe, expect, it } from "vitest";
import { emphasise } from "./emphasise";

/** The bolded names, flattened — the test cares which words were emboldened. */
function bolded(node: ReturnType<typeof emphasise>): string[] {
  if (!Array.isArray(node)) return [];
  return node
    .filter((part): part is { props: { children: string } } =>
      typeof part === "object" && part !== null && "props" in part && "className" in (part as { props: object }).props,
    )
    .map((part) => part.props.children);
}

describe("emphasise", () => {
  it("sets a footballer's name in bold", () => {
    expect(bolded(emphasise("Dan Burn is out.", ["Dan Burn"]))).toEqual(["Dan Burn"]);
  });

  it("does not bold a name inside a longer word", () => {
    // "Newcastle travel to Burnley" printed a bold **Burn**ley.
    expect(bolded(emphasise("Newcastle travel to Burnley.", ["Burn"]))).toEqual([]);
  });

  it("prefers the longer name where two overlap", () => {
    const out = bolded(emphasise("João Pedro is a doubt.", ["Pedro", "João Pedro"]));
    expect(out).toEqual(["João Pedro"]);
  });

  it("leaves prose alone when it names nobody", () => {
    expect(emphasise("Nobody was ruled out.", ["Dan Burn"])).toBe("Nobody was ruled out.");
  });
});
