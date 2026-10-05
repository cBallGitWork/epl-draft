import { describe, expect, it } from "vitest";
import { COLUMNISTS } from "./config";
import { sharePicture } from "./sharePicture";

describe("sharePicture", () => {
  it("hands a columnist's story the crop of him alone", () => {
    expect(sharePicture({ reporter: "Mark Lawrenson", image: null })).toBe(COLUMNISTS["Mark Lawrenson"].card);
  });

  it("prefers the story's own drawing to the columnist's photograph", () => {
    const image = { src: "/paper/gw6.webp", alt: "The rout" };
    expect(sharePicture({ reporter: "Mark Lawrenson", image })).toBe(image.src);
  });

  it("has nothing for a staff story with no drawing", () => {
    expect(sharePicture({ image: null })).toBeNull();
  });
});
