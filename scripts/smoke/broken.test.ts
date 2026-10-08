import { describe, expect, it } from "vitest";
import { serverError } from "./broken";

// A page can answer 200 and still have thrown: Next streams the error into the payload as a row of its own, and the
// browser swaps the page for its error screen. Recorded off /players/04fk1, 8 Oct 2026, with FPL refusing Vercel.
const BROKEN =
  '<script>self.__next_f.push([1,"3d:[\\"$\\",\\"$7\\",null,{\\"fallback\\":null,\\"children\\":\\"$L47\\"}]\\n"])</script>' +
  '<script>self.__next_f.push([1,"47:E{\\"digest\\":\\"578425273\\"}\\n"])</script>';

const HEALTHY =
  '<script>self.__next_f.push([1,"3d:[\\"$\\",\\"$7\\",null,{\\"fallback\\":null,\\"children\\":\\"$L47\\"}]\\n"])</script>' +
  '<script>self.__next_f.push([1,"47:[\\"$\\",\\"table\\",null,{\\"className\\":\\"w-full\\"}]\\n"])</script>';

describe("serverError", () => {
  it("finds the error Next streamed into a page that answered 200", () => {
    expect(serverError(BROKEN)).toBe("578425273");
  });

  it("finds nothing on a page that rendered", () => {
    expect(serverError(HEALTHY)).toBeNull();
  });

  // The word on its own is page text, not an error row: an article about a "digest" must not fail the walk.
  it("is not fooled by the word in the page's own text", () => {
    expect(serverError("<p>The weekly digest is out</p>")).toBeNull();
  });
});
