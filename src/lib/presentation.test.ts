import { describe, it, expect } from "vitest";
import { pagePresentation, roleClass } from "./presentation";

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
