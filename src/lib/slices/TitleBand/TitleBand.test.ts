import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import TitleBand from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const presentation: Presentation = {
  bands: {
    "1": { style: { "background-color": "rgb(1, 2, 3)" } },
  },
};

const slice = {
  slice_type: "title_band",
  variation: "default",
  primary: {
    band: 1,
    heading: "The Space",
    subtitle: "Every corner considered",
  },
  items: [],
} as never;

describe("TitleBand slice", () => {
  it("renders the display line as <h2> and the eyebrow as a text5 label", () => {
    const { container } = render(TitleBand, {
      props: { slice, context: { presentation } },
    });
    // The subtitle is the large display line (the visual heading); the heading
    // field is the small uppercase eyebrow above it.
    expect(container.querySelector("h2")?.textContent).toBe(
      "Every corner considered",
    );
    expect(container.querySelector("h2")?.className).toContain(
      "txt-role-text12",
    );
    const eyebrow = container.querySelector("p.txt-role-text5");
    expect(eyebrow?.textContent).toContain("The Space");
    expect(container.querySelector("section")?.style.backgroundColor).toBe(
      "rgb(1, 2, 3)",
    );
  });

  it("renders a heading-only band as a lone text11 display line", () => {
    const headingOnly = {
      slice_type: "title_band",
      variation: "default",
      primary: { band: 1, heading: "Come Be A Part Of It.", subtitle: "" },
      items: [],
    } as never;
    const { container } = render(TitleBand, {
      props: { slice: headingOnly, context: {} },
    });
    expect(container.querySelector("section")).not.toBeNull();
    const h2 = container.querySelector("h2");
    expect(h2?.textContent).toBe("Come Be A Part Of It.");
    expect(h2?.className).toContain("txt-role-text11");
  });
});
