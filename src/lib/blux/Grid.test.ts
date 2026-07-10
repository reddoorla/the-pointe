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
    expect((cells[0] as HTMLElement).style.flexBasis).toBe("60%");
    expect((cells[1] as HTMLElement).style.flexBasis).toBe("40%");
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

  it("a cell with cols 'any' gets no explicit basis (flex auto)", () => {
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
    expect(cell.style.flexBasis).toBe("");
  });
});
