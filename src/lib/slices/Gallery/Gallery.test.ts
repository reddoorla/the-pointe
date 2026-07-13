import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Gallery from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const presentation: Presentation = {
  bands: {
    "1": {
      gallery: [
        { kind: "image", url: "https://cdn/one.jpg" },
        { kind: "image", url: "https://cdn/two.jpg" },
        { kind: "video", url: "https://cdn/three.mp4" },
      ],
    },
  },
};

const slice = {
  slice_type: "gallery",
  variation: "default",
  primary: { band: 1 },
  items: [],
} as never;

describe("Gallery slice", () => {
  it("renders the first frame full-bleed at 80vh (slider default view)", () => {
    const { container } = render(Gallery, {
      props: { slice, context: { presentation } },
    });
    // One frame shown, like the original's single-frame slider.
    const cells = container.querySelectorAll("[data-gallery-cell]");
    expect(cells).toHaveLength(1);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://cdn/one.jpg");
    expect(img?.className).toContain("h-[80vh]");
    expect(img?.className).toContain("object-cover");
  });

  it("renders nothing without a manifest gallery payload", () => {
    const { container } = render(Gallery, {
      props: { slice, context: { presentation: { bands: {} } } },
    });
    expect(container.querySelector("section")).toBeNull();
  });
});
