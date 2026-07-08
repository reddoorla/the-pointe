import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import MediaText from "./index.svelte";

function makeSlice(variation: "imageRight" | "imageLeft") {
  return {
    slice_type: "media_text",
    variation,
    primary: {
      heading: [{ type: "heading2", text: "Amenities", spans: [] }],
      body: [{ type: "paragraph", text: "A resort-style pool.", spans: [] }],
      media: {
        url: "https://img.example/pool.jpg",
        alt: "Pool",
        dimensions: { width: 800, height: 600 },
      },
    },
    items: [],
  } as unknown as Content.MediaTextSlice;
}

describe("MediaText slice", () => {
  it("renders heading, body, and image with alt", () => {
    const { getByRole } = render(MediaText, {
      props: { slice: makeSlice("imageRight") },
    });
    expect(getByRole("heading", { level: 2 }).textContent).toContain(
      "Amenities",
    );
    expect(getByRole("img").getAttribute("alt")).toBe("Pool");
  });

  it("reverses the image side for imageLeft via grid order", () => {
    const { container } = render(MediaText, {
      props: { slice: makeSlice("imageLeft") },
    });
    // the editorial split reverses by ordering the grid columns, not a flex
    // reverse: copy moves to order-2, media to order-1.
    expect(container.querySelector(".mt-copy")?.className).toContain(
      "lg:order-2",
    );
    expect(container.querySelector(".mt-media")?.className).toContain(
      "lg:order-1",
    );
  });

  it("renders a media-only row as a centered feature image (no empty copy column)", () => {
    const slice = makeSlice("imageRight");
    // strip the text so only the image remains
    (slice.primary as { heading: unknown[]; body: unknown[] }).heading = [];
    (slice.primary as { heading: unknown[]; body: unknown[] }).body = [];
    const { container } = render(MediaText, { props: { slice } });
    expect(container.querySelector(".mt-copy")).toBeNull();
    expect(container.querySelector(".mt-media")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Pool");
  });
});
