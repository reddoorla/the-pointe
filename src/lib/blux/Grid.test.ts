import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Grid from "./Grid.svelte";
import type { RenderNode } from "./presentation";

afterEach(() => cleanup());

const tree: RenderNode = {
  kind: "stack",
  children: [
    { kind: "heading", level: 2, html: "The <em>Space</em>", role: "text2" },
    {
      kind: "row",
      cells: [
        {
          token: { cols: 2, ratio: 60 },
          node: { kind: "body", html: "<p>Left copy</p>", role: "text4" },
        },
        {
          token: { cols: 2, ratio: 40 },
          node: {
            kind: "media",
            media: { kind: "image", url: "https://cdn/a.jpg" },
          },
        },
      ],
    },
  ],
};

describe("Grid (recursive fallback)", () => {
  it("renders nested rows/cells with token widths and role classes", () => {
    const { container } = render(Grid, { props: { node: tree } });
    const h2 = container.querySelector("h2");
    expect(h2?.innerHTML).toContain("The <em>Space</em>");
    expect(h2?.className).toContain("txt-role-text2");
    const cells = container.querySelectorAll("[data-grid-cell]");
    expect(cells).toHaveLength(2);
    expect(
      (cells[0] as HTMLElement).style.getPropertyValue("--cell-basis"),
    ).toBe("60%");
    expect(
      (cells[1] as HTMLElement).style.getPropertyValue("--cell-basis"),
    ).toBe("40%");
    // Cells stack full-width on mobile; the token basis applies from md: up.
    expect((cells[0] as HTMLElement).className).toContain("basis-full");
    expect((cells[0] as HTMLElement).className).toContain(
      "md:basis-(--cell-basis)",
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn/a.jpg",
    );
    expect(container.textContent).toContain("Left copy");
  });

  it("renders raw html verbatim and a placeholder for widgets", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          children: [
            { kind: "raw", html: "<div class='legacy'>kept</div>" },
            { kind: "widget", widget: { type: "map" } },
          ],
        },
      },
    });
    expect(container.querySelector(".legacy")?.textContent).toBe("kept");
    expect(container.querySelector("[data-widget='map']")).not.toBeNull();
  });

  it("mounts LocationMap for a widget:map when a map config is provided", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          children: [{ kind: "widget", widget: { type: "map" } }],
        },
        map: { mid: "M", layers: [], toggles: [], styles: [] },
      },
    });
    expect(container.querySelector("[data-map-placeholder]")).not.toBeNull();
    expect(container.querySelector("[data-widget='map']")).toBeNull();
  });

  it("clamps heading levels to the h1–h6 range", () => {
    const { container } = render(Grid, {
      props: {
        node: { kind: "heading", level: 9, html: "Deep" },
      },
    });
    expect(container.querySelector("h6")).not.toBeNull();
    expect(container.querySelector("h9")).toBeNull();
  });

  it("a cell with cols 'any' falls back to an auto basis from md: up", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          cells: [
            { token: { cols: "any" }, node: { kind: "subtitle", text: "s" } },
          ],
        },
      },
    });
    const cell = container.querySelector("[data-grid-cell]") as HTMLElement;
    expect(cell.style.getPropertyValue("--cell-basis")).toBe("auto");
    expect(cell.className).toContain("basis-full");
    expect(cell.className).toContain("md:basis-(--cell-basis)");
  });

  it("renders media in a w-full block wrapper with an inline-block image (never mx-auto centered)", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "media",
          media: { kind: "image", url: "https://cdn/logo.png" },
        },
      },
    });
    const img = container.querySelector("img") as HTMLElement;
    expect(img).not.toBeNull();
    // The image is inline so it follows the ancestor's text-align instead of
    // being force-centered — Blux `.ib` graphics are positioned by text-align.
    expect(img.className).toContain("inline-block");
    expect(img.className).not.toContain("mx-auto");
    // A left-aligned ancestor therefore leaves it left: there is no centering
    // class, and the image sits in a full-width block wrapper.
    const wrapper = img.parentElement as HTMLElement;
    expect(wrapper.className).toContain("w-full");
  });

  it("renders a heading's export style: color/padding inline, margin-right as a desktop-only var", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "heading",
          level: 2,
          html: "Hi",
          role: "text11",
          style: {
            color: "rgb(255, 255, 255)",
            padding: "10px 20px",
            "margin-right": "20%",
          },
        },
      },
    });
    const h2 = container.querySelector("h2") as HTMLElement;
    expect(h2.style.color).toBe("rgb(255, 255, 255)");
    expect(h2.style.padding).toBe("10px 20px");
    // The role class still applies alongside the deviations.
    expect(h2.className).toContain("txt-role-text11");
    // margin-right is desktop-only in the source (reset ≤800px): it must NOT be
    // an unconditional inline margin (which would leak onto mobile), but a
    // `--node-mr` var consumed by a md:-scoped class.
    expect(h2.style.marginRight).toBe("");
    expect(h2.style.getPropertyValue("--node-mr")).toBe("20%");
    expect(h2.className).toContain("md:mr-(--node-mr)");
  });

  it("renders a subtitle's inline color and omits the margin var/class when margin-right is absent", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "subtitle",
          text: "sub",
          role: "text5",
          style: { color: "rgb(255, 255, 255)" },
        },
      },
    });
    const p = container.querySelector("p") as HTMLElement;
    expect(p.style.color).toBe("rgb(255, 255, 255)");
    expect(p.className).toContain("txt-role-text5");
    expect(p.className).not.toContain("md:mr-(--node-mr)");
    expect(p.style.getPropertyValue("--node-mr")).toBe("");
  });
});
