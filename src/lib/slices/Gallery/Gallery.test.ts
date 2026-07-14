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

  it("renders the true slider when the manifest carries a carousel payload", () => {
    // Transition shape: band 8 keeps its gallery payload (caption text) and
    // gains the carousel payload — the slider renders, captions zipped in.
    const transitional: Presentation = {
      bands: {
        "8": {
          gallery: [
            {
              kind: "image",
              url: "https://cdn/one.jpg",
              caption: "a place to sit and breathe",
            },
            { kind: "image", url: "https://cdn/two.jpg", caption: "a view" },
          ],
          carousel: {
            slides: [
              {
                media: {
                  kind: "image",
                  url: "https://cdn/one.jpg",
                  minHeight: "80vh",
                },
                caption: { level: 5, role: "text5" },
              },
              {
                media: {
                  kind: "image",
                  url: "https://cdn/two.jpg",
                  minHeight: "80vh",
                },
                caption: { level: 5, role: "text5" },
              },
            ],
            columns: 1,
          },
        },
      },
    };
    const carouselSlice = {
      slice_type: "gallery",
      variation: "default",
      primary: { band: 8 },
      items: [],
    } as never;
    const { container, getByRole } = render(Gallery, {
      props: { slice: carouselSlice, context: { presentation: transitional } },
    });
    // Still the /#8 anchor section, now wrapping an APG slider region.
    expect(container.querySelector("section")?.getAttribute("id")).toBe("8");
    expect(getByRole("region").getAttribute("aria-roledescription")).toBe(
      "carousel",
    );
    // Captions come from the coexisting gallery frames, roles from the slides.
    const captions = container.querySelectorAll("figcaption");
    expect(captions).toHaveLength(2);
    expect(captions[0]?.textContent).toBe("a place to sit and breathe");
    expect(captions[0]?.querySelector("span")?.className).toContain(
      "txt-role-text5",
    );
    // Neither fallback mode also rendered (full-bleed cell / captioned grid).
    expect(container.querySelector("[data-gallery-cell]")).toBeNull();
    expect(container.querySelector("p.txt-role-text5")).toBeNull();
  });

  it("keeps the pre-carousel modes when no carousel payload exists", () => {
    const captioned: Presentation = {
      bands: {
        "1": {
          gallery: [
            { kind: "image", url: "https://cdn/one.jpg", caption: "one" },
            { kind: "image", url: "https://cdn/two.jpg", caption: "two" },
          ],
        },
      },
    };
    const { container } = render(Gallery, {
      props: { slice, context: { presentation: captioned } },
    });
    // Captioned grid, not a slider.
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });
});
