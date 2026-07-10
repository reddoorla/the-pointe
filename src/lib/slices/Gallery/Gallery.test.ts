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
  it("renders one cell per manifest media item", () => {
    const { container } = render(Gallery, {
      props: { slice, context: { presentation } },
    });
    const cells = container.querySelectorAll("[data-gallery-cell]");
    expect(cells).toHaveLength(3);
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.querySelectorAll("video")).toHaveLength(1);
  });

  it("renders nothing without a manifest gallery payload", () => {
    const { container } = render(Gallery, {
      props: { slice, context: { presentation: { bands: {} } } },
    });
    expect(container.querySelector("section")).toBeNull();
  });
});
