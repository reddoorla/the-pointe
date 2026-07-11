import { describe, expect, it, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import LocationMap from "./LocationMap.svelte";
import type { MapRenderConfig } from "./presentation";

afterEach(() => cleanup());

const config: MapRenderConfig = {
  mid: "test-mid",
  layers: [
    {
      name: "Portfolio",
      lid: "L0",
      initiallyVisible: true,
      preserveViewport: false,
    },
    {
      name: "Dining",
      lid: "L1",
      initiallyVisible: false,
      preserveViewport: true,
    },
    {
      name: "Parks",
      lid: "L2",
      initiallyVisible: false,
      preserveViewport: true,
    },
  ],
  toggles: [
    { label: "All", layers: ["Portfolio"] },
    { label: "Dining", layers: ["Dining"] },
    { label: "Parks", layers: ["Parks"] },
  ],
  styles: [],
};

describe("LocationMap", () => {
  it("renders the keyless placeholder and never injects the Maps script", () => {
    const { container } = render(LocationMap, { props: { map: config } });
    expect(container.querySelector("[data-map-placeholder]")).not.toBeNull();
    expect(document.querySelector('script[src*="maps.googleapis"]')).toBeNull();
  });

  it("renders one chip button per toggle with its label", () => {
    const { getAllByRole } = render(LocationMap, { props: { map: config } });
    const chips = getAllByRole("button");
    expect(chips).toHaveLength(3);
    expect(chips.map((c) => c.textContent?.trim())).toEqual([
      "All",
      "Dining",
      "Parks",
    ]);
  });

  it("chips are radio-style: first pressed by default, click moves the press", async () => {
    const { getAllByRole } = render(LocationMap, { props: { map: config } });
    const chips = getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    const second = chips[1];
    expect(second).toBeDefined();
    if (!second) throw new Error("missing chip");
    await fireEvent.click(second);
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });
});
