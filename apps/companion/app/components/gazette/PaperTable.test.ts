import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaperTable, { type PaperTableRow } from "./PaperTable";

/** The width utilities on the cell that prints `text`: two on one element resolve by stylesheet order, not class order. */
function widthsOf(rows: PaperTableRow[], text: string): string[] {
  const html = renderToStaticMarkup(createElement(PaperTable, { title: "Table", rows }));
  const cell = html.match(new RegExp(`<span class="([^"]*)">${text.replace(/[+]/g, "\\+")}</span>`));
  return (cell?.[1] ?? "").split(" ").filter((name) => name.startsWith("w-"));
}

describe("PaperTable's middle column", () => {
  it("sets goal difference beside a played count at the narrow width alone", () => {
    const row = { key: "1", rank: 1, name: "Arsenal", played: 7, detail: "+9", points: 19 };
    expect(widthsOf([row], "+9")).toEqual(["w-12"]);
  });

  it("gives an owner's name on the scorers chart the wide width", () => {
    const row = { key: "1", rank: 1, name: "Haaland", played: null, detail: "free agent", points: 61 };
    expect(widthsOf([row], "free agent")).toEqual(["w-20"]);
  });
});
