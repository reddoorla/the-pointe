import { describe, it, expect } from "vitest";
import {
  bandStyle,
  contentStyle,
  pagePresentation,
  roleClass,
} from "./presentation";

describe("roleClass", () => {
  it("names the role utility class", () => {
    expect(roleClass("text5")).toBe("txt-role-text5");
  });
  it("returns empty string when no role is known (keeps the base default)", () => {
    expect(roleClass(undefined)).toBe("");
  });
});

describe("pagePresentation", () => {
  it("keys the bundled thePointe manifest by slice index", () => {
    const map = pagePresentation("the-pointe");
    expect(map.size).toBeGreaterThan(0);
    // slice 0 is the opening hero band; slice 3 is the first magazine grid
    // whose first item is the text5 eyebrow "The Pointe"
    const grid = map.get(3);
    expect(grid?.sliceType).toBe("section_grid");
    expect(grid?.items?.[0]?.headingRole).toBe("text5");
    expect(grid?.items?.[1]?.headingRole).toBe("text11");
  });
  it("returns an empty map for an unknown page (roles fall back to defaults)", () => {
    expect(pagePresentation("no-such-page").size).toBe(0);
  });
});

describe("bandStyle", () => {
  it("is empty when the block carries no styling", () => {
    expect(bandStyle(undefined)).toBe("");
    expect(bandStyle({})).toBe("");
  });
  it("paints a full-bleed background band from background-color", () => {
    expect(bandStyle({ "background-color": "#ffffff" })).toBe(
      "background-color: #ffffff",
    );
  });
  it("turns a height into a min-height flex band aligned by vertical-align", () => {
    expect(bandStyle({ height: "100vh", "vertical-align": "middle" })).toBe(
      "min-height: 100vh; display: flex; flex-direction: column; justify-content: center",
    );
  });
  it("maps top/bottom vertical-align, defaulting to center", () => {
    expect(bandStyle({ height: "80vh", "vertical-align": "top" })).toContain(
      "justify-content: flex-start",
    );
    expect(bandStyle({ height: "80vh", "vertical-align": "bottom" })).toContain(
      "justify-content: flex-end",
    );
    // real captured-height blocks always name a vertical-align; the default
    // only bites the hero fallback below, which wants a centered overlay
    expect(bandStyle({ height: "80vh" })).toContain("justify-content: center");
  });
  it("combines a background band and a height band", () => {
    expect(bandStyle({ "background-color": "#ffffff", height: "600px" })).toBe(
      "background-color: #ffffff; min-height: 600px; display: flex; flex-direction: column; justify-content: center",
    );
  });
  it("falls back to a caller height only when the block sets none", () => {
    // hero with no captured height still needs to stand tall enough for its
    // background image; a captured height always wins over the fallback
    expect(bandStyle({}, "45vh")).toBe(
      "min-height: 45vh; display: flex; flex-direction: column; justify-content: center",
    );
    expect(bandStyle({ height: "80vh" }, "45vh")).toContain("min-height: 80vh");
  });
  it("ignores a literal 'none' height", () => {
    expect(bandStyle({ height: "none" })).toBe("");
  });
});

describe("contentStyle", () => {
  it("is empty when the block constrains nothing", () => {
    expect(contentStyle(undefined)).toBe("");
    expect(contentStyle({})).toBe("");
  });
  it("narrows the content box to the captured max-content-width", () => {
    expect(contentStyle({ "_max-content-width": "920px" })).toBe(
      "max-width: 920px",
    );
  });
  it("passes the captured text alignment through", () => {
    expect(
      contentStyle({ "_max-content-width": "1280px", "text-align": "left" }),
    ).toBe("max-width: 1280px; text-align: left");
  });
  it("ignores a 'none' max-content-width", () => {
    expect(contentStyle({ "_max-content-width": "none" })).toBe("");
  });
});
