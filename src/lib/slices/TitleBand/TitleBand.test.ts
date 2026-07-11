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
  it("renders heading and subtitle inside a manifest-styled section", () => {
    const { container } = render(TitleBand, {
      props: { slice, context: { presentation } },
    });
    expect(container.querySelector("h2")?.textContent).toBe("The Space");
    expect(container.querySelector("p")?.textContent).toContain(
      "Every corner considered",
    );
    expect(container.querySelector("section")?.style.backgroundColor).toBe(
      "rgb(1, 2, 3)",
    );
  });

  it("renders Prismic-only with no context (bare section still shows heading)", () => {
    const { container } = render(TitleBand, {
      props: { slice, context: {} },
    });
    expect(container.querySelector("section")).not.toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("The Space");
  });
});
