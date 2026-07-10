import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import SectionBand from "./SectionBand.svelte";

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
