import { describe, expect, it } from "vitest";
import { COLUMNISTS } from "./config";
import { sharePicture } from "./sharePicture";

describe("sharePicture", () => {
  const lawro = COLUMNISTS["Mark Lawrenson"].photo;

  it("hands a columnist's story his photograph", () => {
    expect(sharePicture({ reporter: "Mark Lawrenson", image: null })).toEqual({ url: lawro.src, alt: lawro.alt });
  });

  it("prefers the story's own drawing to the columnist's photograph", () => {
    const image = { src: "/paper/gw6.webp", alt: "The rout" };
    expect(sharePicture({ reporter: "Mark Lawrenson", image })).toEqual({ url: image.src, alt: image.alt });
  });

  it("has nothing for a staff story with no drawing", () => {
    expect(sharePicture({ image: null })).toBeNull();
  });
});
