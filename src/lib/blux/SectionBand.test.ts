import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import SectionBand from "./SectionBand.svelte";

// jsdom has no matchMedia; Media queries prefers-reduced-motion for videos.
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
});

afterEach(() => cleanup());
const children = () =>
  createRawSnippet(() => ({ render: () => "<p>content</p>" }));

describe("SectionBand", () => {
  it("applies the style record inline and renders children", () => {
    const { container } = render(SectionBand, {
      props: {
        band: {
          style: { "background-color": "rgb(1, 2, 3)", "min-height": "50vh" },
        },
        children: children(),
      },
    });
    const section = container.querySelector("section");
    expect(section?.style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(section?.style.minHeight).toBe("50vh");
    expect(section?.textContent).toContain("content");
  });

  it("renders a background video behind the content when band.background is a video", () => {
    const { container } = render(SectionBand, {
      props: {
        band: { background: { kind: "video", url: "https://cdn/bg.mp4" } },
        children: children(),
      },
    });
    expect(container.querySelector("video")?.getAttribute("src")).toBe(
      "https://cdn/bg.mp4",
    );
    // Decorative background media must stay out of the a11y tree.
    expect(
      container.querySelector("[aria-hidden='true'] video"),
    ).not.toBeNull();
  });

  it("passes eager loading to the background image when eagerBackground is set", () => {
    const { container } = render(SectionBand, {
      props: {
        band: { background: { kind: "image", url: "https://cdn/bg.jpg" } },
        eagerBackground: true,
        children: children(),
      },
    });
    expect(container.querySelector("img")?.getAttribute("loading")).toBe(
      "eager",
    );
  });

  it("background image stays lazy by default", () => {
    const { container } = render(SectionBand, {
      props: {
        band: { background: { kind: "image", url: "https://cdn/bg.jpg" } },
        children: children(),
      },
    });
    expect(container.querySelector("img")?.getAttribute("loading")).toBe(
      "lazy",
    );
  });

  it("renders a bare section with no media when band is null", () => {
    const { container } = render(SectionBand, {
      props: { band: null, children: children() },
    });
    expect(container.querySelector("section")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });
});
