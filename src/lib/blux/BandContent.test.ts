import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import BandContent from "./BandContent.svelte";

afterEach(() => cleanup());

const children = () =>
  createRawSnippet(() => ({ render: () => "<p>content</p>" }));

describe("BandContent", () => {
  it("emits a fixed inline padding and no band-pad class when there is no mobile override", () => {
    const { container } = render(BandContent, {
      props: {
        band: { style: { _contentPadding: "100px 4% 100px 4%" } },
        children: children(),
      },
    });
    const box = container.querySelector("div.w-full") as HTMLElement;
    expect(box).not.toBeNull();
    // Inline padding still drives the box (unchanged pre-task behavior).
    expect(box.style.padding).toContain("100px");
    expect(box.style.padding).toContain("4%");
    expect(box.className).not.toContain("band-pad");
    // No CSS-var handoff when there is no mobile override.
    expect(box.style.getPropertyValue("--band-pad")).toBe("");
    expect(box.style.getPropertyValue("--band-pad-m")).toBe("");
  });

  it("falls back to the default 0 4% gutter padding when the band omits _contentPadding", () => {
    const { container } = render(BandContent, {
      props: { band: { style: {} }, children: children() },
    });
    const box = container.querySelector("div.w-full") as HTMLElement;
    // Default gutter is still emitted inline, no var handoff.
    expect(box.style.padding).toContain("4%");
    expect(box.className).not.toContain("band-pad");
    expect(box.style.getPropertyValue("--band-pad")).toBe("");
  });

  it("hands padding to --band-pad/--band-pad-m + the band-pad class when a mobile override is present", () => {
    const { container } = render(BandContent, {
      props: {
        band: {
          style: {
            _contentPadding: "100px 4% 100px 4%",
            _contentPaddingMobile: "40px 4% 40px 4%",
          },
        },
        children: children(),
      },
    });
    const box = container.querySelector("div.w-full") as HTMLElement;
    expect(box.className).toContain("band-pad");
    // The fixed inline padding is gone; the .band-pad class + vars drive it
    // responsively (desktop var, ≤700px mobile override — see app.css).
    expect(box.style.padding).toBe("");
    expect(box.style.getPropertyValue("--band-pad")).toBe("100px 4% 100px 4%");
    expect(box.style.getPropertyValue("--band-pad-m")).toBe("40px 4% 40px 4%");
  });

  it("still applies the max-width box and renders children", () => {
    const { container } = render(BandContent, {
      props: {
        band: { style: { "_max-content-width": "960px" } },
        children: children(),
      },
    });
    const box = container.querySelector("div.w-full") as HTMLElement;
    expect(box.style.maxWidth).toBe("960px");
    expect(box.textContent).toContain("content");
  });
});
