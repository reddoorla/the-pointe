import { describe, expect, it } from "vitest";
import { bandFor, cellWidth, loadPresentation } from "./presentation";
import type { Presentation } from "./presentation";

describe("presentation", () => {
  it("loadPresentation returns the checked-in converted the-pointe manifest", () => {
    const p = loadPresentation();
    // The manifest is now the real plan-5 convert output (16 bands, keyed by
    // string index). Band 14 carries the co-located map payload.
    expect(Object.keys(p.bands).length).toBe(16);
    expect(bandFor(p, 14)?.map?.mid).toBeTruthy();
  });

  it("bandFor looks up by band index and returns null when absent", () => {
    const p: Presentation = {
      bands: { "3": { style: { "background-color": "#eef" } } },
    };
    expect(bandFor(p, 3)?.style?.["background-color"]).toBe("#eef");
    expect(bandFor(p, 4)).toBeNull();
    expect(bandFor(undefined, 3)).toBeNull();
  });

  it("bandFor tolerates a manifest missing the bands key", () => {
    expect(bandFor({} as Presentation, 1)).toBeNull();
  });

  it("cellWidth: ratio → %, spacing ignored, numeric cols → 100/cols, any → null", () => {
    expect(cellWidth({ cols: 2, ratio: 60 })).toBe("60%");
    // spacing is a gap, not a width: a 1-col grid stacks full-width.
    expect(cellWidth({ cols: 1, spacing: 40 })).toBe("100%");
    expect(cellWidth({ cols: 4 })).toBe("25%");
    expect(cellWidth({ cols: 3 })).toBe("33.3333%");
    expect(cellWidth({ cols: "any", spacing: 20 })).toBeNull();
  });

  it("cellWidth guards non-positive cols instead of yielding Infinity%", () => {
    expect(cellWidth({ cols: 0 })).toBeNull();
  });

  it("carries the map payload on a band (plan 4 render contract)", () => {
    const p: Presentation = {
      bands: {
        "14": {
          map: {
            mid: "M",
            layers: [
              {
                name: "A",
                lid: "L",
                initiallyVisible: true,
                preserveViewport: false,
              },
            ],
            toggles: [{ label: "All", layers: ["A"] }],
            styles: [],
          },
        },
      },
    };
    expect(bandFor(p, 14)?.map?.mid).toBe("M");
  });
});
