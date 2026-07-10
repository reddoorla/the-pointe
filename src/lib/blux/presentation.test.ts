import { describe, expect, it } from "vitest";
import { bandFor, cellWidth, loadPresentation } from "./presentation";
import type { Presentation } from "./presentation";

describe("presentation", () => {
  it("loadPresentation returns the checked-in manifest (empty bands to start)", () => {
    const p = loadPresentation();
    expect(p.bands).toEqual({});
  });

  it("bandFor looks up by band index and returns null when absent", () => {
    const p: Presentation = {
      bands: { "3": { style: { "background-color": "#eef" } } },
    };
    expect(bandFor(p, 3)?.style?.["background-color"]).toBe("#eef");
    expect(bandFor(p, 4)).toBeNull();
    expect(bandFor(undefined, 3)).toBeNull();
  });

  it("cellWidth: ratio → %, sized → %, numeric cols → 100/cols, any → null", () => {
    expect(cellWidth({ cols: 2, ratio: 60 })).toBe("60%");
    expect(cellWidth({ cols: 1, sized: 40 })).toBe("40%");
    expect(cellWidth({ cols: 4 })).toBe("25%");
    expect(cellWidth({ cols: 3 })).toBe("33.3333%");
    expect(cellWidth({ cols: "any" })).toBeNull();
  });
});
