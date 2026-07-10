import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Hero from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const presentation: Presentation = {
  bands: {
    "7": {
      style: { "min-height": "80vh" },
      background: { kind: "image", url: "https://cdn/hero-bg.jpg" },
    },
  },
};

describe("Hero band variation", () => {
  it("renders overlay heading/subtitle over the manifest background", () => {
    const slice = {
      slice_type: "hero",
      variation: "band",
      primary: { band: 7, heading: "the outdoors", subtitle: "fresh air" },
      items: [],
    } as never;
    const { container } = render(Hero, {
      props: { slice, context: { presentation } },
    });
    expect(container.querySelector("h2")?.textContent).toBe("the outdoors");
    expect(container.textContent).toContain("fresh air");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn/hero-bg.jpg",
    );
    expect(container.querySelector("section")?.style.minHeight).toBe("80vh");
  });
});
