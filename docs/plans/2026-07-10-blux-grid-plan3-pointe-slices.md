# Blux Grid — Plan 3: the-pointe band slice set + recursive Grid fallback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The render side of the faithful-grid pipeline: a presentation-manifest module, a `SectionBand` wrapper, a recursive `Grid.svelte` fallback renderer, and the pattern band slices (`grid_band`, `title_band`, `split_feature`, `gallery`, `media_full`, a `band` variation on `hero`) — all additive, so the live archetype content keeps rendering untouched.

**Architecture:** Every band slice carries a `band` (Number) field written at emit (plan 5). Band-level *presentation* — style record, background media, fallback trees, media payloads — lives in `src/lib/blux/blux-presentation.json`, loaded by `src/lib/blux/presentation.ts` and passed to every slice via `SliceZone`'s `context` prop. Pattern slices keep their *text* CMS-editable in Prismic; the Grid fallback renders its whole serialized node tree from the manifest (locked design decision #4 in the spec, `reddoor-maintenance` docs/superpowers/specs/2026-07-08-blux-faithful-grid-slices-design.md). Nothing in this plan deletes or alters the rendering of the existing `hero`(default)/`media_text`/`section_grid`/`rich_text`/`collection_list` slices — the live page must keep working until plan 7 re-migrates.

**Tech Stack:** Svelte 5 (runes, snippets), SvelteKit, @prismicio/svelte 2 (SliceZone passes `slice`, `index`, `slices`, `context` props), vitest + @testing-library/svelte (co-located `*.test.ts`), Tailwind 4. Gate: `pnpm lint` (prettier+eslint), `pnpm check` (svelte-check), `pnpm test`, `pnpm build`.

**Key repo facts (verified):**

- `src/lib/slices/index.js` is Slice-Machine-generated; hand-extend it in the same shape.
- `src/lib/components/Img.svelte` requires vite-imagetools imports — **unusable for runtime URL strings**; manifest media renders with plain `<img>`/`<video>`.
- Component tests use `render`/`cleanup` from @testing-library/svelte with a `FakeIntersectionObserver` + `matchMedia` mock boilerplate (copy from `src/lib/components/ContentWidth.test.ts`) and `createRawSnippet` for snippet props.
- `{@html}` is already the repo's pattern for build-time-trusted content; manifest HTML is emitted by our own pipeline, same trust class as Prismic rich text.
- Page SliceZones: `src/routes/[[preview=preview]]/+page.svelte:8` and `src/routes/[[preview=preview]]/[uid]/+page.svelte` (+ `src/routes/slice-simulator/+page.svelte`).

**Guardrails:**

- ADDITIVE ONLY: do not modify the existing slices' components or models except `rich_text` gaining one **optional** `band` field (old docs without it must render exactly as today).
- Missing manifest entry is never a crash: band slices render their Prismic-native content inside a bare `<section>`; the Grid fallback renders nothing (an HTML comment) and logs `console.warn` in dev only.
- Every new component gets a co-located test; TDD each task.

---

## File structure

- Create: `src/lib/blux/presentation.ts` (types + loader + helpers), `src/lib/blux/blux-presentation.json` (checked-in, starts empty), `src/lib/blux/Media.svelte`, `src/lib/blux/SectionBand.svelte`, `src/lib/blux/Grid.svelte` (+ co-located tests)
- Create: `src/lib/slices/GridBand/{model.json,index.svelte}`, `src/lib/slices/TitleBand/…`, `src/lib/slices/SplitFeature/…`, `src/lib/slices/Gallery/…`, `src/lib/slices/MediaFull/…`
- Modify: `src/lib/slices/Hero/model.json` (add `band` variation), `src/lib/slices/Hero/index.svelte` (render the new variation; default untouched), `src/lib/slices/RichText/model.json` (+optional band) & `index.svelte` (optional SectionBand wrap), `src/lib/slices/index.js`, the three SliceZone call sites, `src/routes/dev/a11y-fixtures/+page.svelte`

---

## Task 1: presentation module + manifest

**Files:**

- Create: `src/lib/blux/blux-presentation.json`
- Create: `src/lib/blux/presentation.ts`
- Test: `src/lib/blux/presentation.test.ts`

- [ ] **Step 1: Write the failing test** (`src/lib/blux/presentation.test.ts`):

```ts
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
```

- [ ] **Step 2: Run → FAIL** (`pnpm exec vitest run src/lib/blux/presentation.test.ts` — module not found).

- [ ] **Step 3: Implement.** `src/lib/blux/blux-presentation.json`:

```json
{ "bands": {} }
```

`src/lib/blux/presentation.ts`:

```ts
// Render-side contract for the Blux faithful-grid pipeline (plan 3 of
// reddoor-maintenance docs/superpowers/specs/2026-07-08-blux-faithful-grid-slices-design.md).
// The emit stage (plan 5) writes blux-presentation.json: per-band presentation
// (style record, background media, Grid fallback trees, media payloads) keyed
// by band index. Pattern-slice TEXT stays CMS-editable in Prismic; this module
// carries everything Prismic's flat model can't.
import manifest from "./blux-presentation.json";

export type RenderMedia = {
  kind: "image" | "video";
  /** Absolute URL (Prismic CDN after emit). */
  url: string;
  alt?: string;
};

export type GridToken = { cols: number | "any"; ratio?: number; sized?: number };

export type RenderNode =
  | { kind: "row"; cells: RenderCell[] }
  | { kind: "stack"; children: RenderNode[] }
  | { kind: "heading"; level: number; html: string; role?: string }
  | { kind: "body"; html: string; role?: string }
  | { kind: "subtitle"; text: string; role?: string }
  | { kind: "media"; media: RenderMedia }
  | { kind: "raw"; html: string }
  | { kind: "widget"; widget: { type: "map" } };

export type RenderCell = { token: GridToken; node: RenderNode };

export type BandPresentation = {
  /** CSS property → value, applied inline on the band <section>. */
  style?: Record<string, string>;
  /** Band-level background media, rendered behind the content box. */
  background?: RenderMedia;
  /** Grid fallback: the band's whole serialized node tree. */
  tree?: RenderNode;
  /** SplitFeature payload (text side may contain nested media — render recursively). */
  split?: { mediaSide: "left" | "right"; ratio: number; media: RenderMedia; text: RenderNode };
  /** Gallery payload. */
  gallery?: RenderMedia[];
  /** MediaFull payload. */
  media?: RenderMedia;
};

export type Presentation = { bands: Record<string, BandPresentation> };

export function loadPresentation(): Presentation {
  return manifest as Presentation;
}

/** The presentation entry for a band index, or null. Tolerates an absent
 * presentation entirely (SliceZone context not wired, simulator, tests). */
export function bandFor(
  presentation: Presentation | undefined,
  band: number | null | undefined,
): BandPresentation | null {
  if (!presentation || band === null || band === undefined) return null;
  return presentation.bands[String(band)] ?? null;
}

/** A cell's CSS width from its grid token; null = let flex distribute. */
export function cellWidth(token: GridToken): string | null {
  if (typeof token.ratio === "number") return `${token.ratio}%`;
  if (typeof token.sized === "number") return `${token.sized}%`;
  if (token.cols === "any") return null;
  return `${Math.round((100 / token.cols) * 10000) / 10000}%`;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add src/lib/blux && git commit -m "feat(blux): presentation manifest module (render-side contract)"`

---

## Task 2: Media.svelte + SectionBand.svelte

**Files:**

- Create: `src/lib/blux/Media.svelte`, `src/lib/blux/SectionBand.svelte`
- Test: `src/lib/blux/Media.test.ts`, `src/lib/blux/SectionBand.test.ts`

- [ ] **Step 1: Write the failing tests.** `Media.test.ts`:

```ts
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Media from "./Media.svelte";

afterEach(() => cleanup());

describe("Media", () => {
  it("renders an <img loading=lazy> for kind image with alt defaulting empty", () => {
    const { container } = render(Media, {
      props: { media: { kind: "image", url: "https://cdn/x.jpg" } },
    });
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://cdn/x.jpg");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders an ambient <video> for kind video (muted, loop, playsinline, autoplay, metadata)", () => {
    const { container } = render(Media, {
      props: { media: { kind: "video", url: "https://cdn/x.mp4" } },
    });
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe("https://cdn/x.mp4");
    expect(video?.hasAttribute("autoplay")).toBe(true);
    expect(video?.hasAttribute("loop")).toBe(true);
    expect(video?.hasAttribute("playsinline")).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
    // muted is a property, not always reflected as an attribute
    expect((video as HTMLVideoElement).muted).toBe(true);
  });
});
```

`SectionBand.test.ts` (copy the FakeIntersectionObserver/matchMedia boilerplate from `src/lib/components/ContentWidth.test.ts` if rendering warns without it; start without and add only if needed):

```ts
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import SectionBand from "./SectionBand.svelte";

afterEach(() => cleanup());
const children = () => createRawSnippet(() => ({ render: () => "<p>content</p>" }));

describe("SectionBand", () => {
  it("applies the style record inline and renders children", () => {
    const { container } = render(SectionBand, {
      props: {
        band: { style: { "background-color": "rgb(1, 2, 3)", "min-height": "50vh" } },
        children: children(),
      },
    });
    const section = container.querySelector("section");
    expect(section?.style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(section?.style.minHeight).toBe("50vh");
    expect(section?.textContent).toContain("content");
  });

  it("renders a background video behind the content when band.background is a video", () => {
    const { container } = render(SectionBand, {
      props: {
        band: { background: { kind: "video", url: "https://cdn/bg.mp4" } },
        children: children(),
      },
    });
    expect(container.querySelector("video")?.getAttribute("src")).toBe("https://cdn/bg.mp4");
  });

  it("renders a bare section with no media when band is null", () => {
    const { container } = render(SectionBand, { props: { band: null, children: children() } });
    expect(container.querySelector("section")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement.** `src/lib/blux/Media.svelte`:

```svelte
<script lang="ts">
  import type { RenderMedia } from "./presentation";

  type Props = { media: RenderMedia; class?: string };
  let { media, class: passedClasses = "" }: Props = $props();
</script>

{#if media.kind === "video"}
  <!-- Ambient loop, muted so autoplay is allowed everywhere. -->
  <video src={media.url} class={passedClasses} autoplay loop muted playsinline preload="metadata"
  ></video>
{:else}
  <img src={media.url} alt={media.alt ?? ""} loading="lazy" class={passedClasses} />
{/if}
```

`src/lib/blux/SectionBand.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { BandPresentation } from "./presentation";
  import Media from "./Media.svelte";

  type Props = { band: BandPresentation | null; children: Snippet };
  let { band, children }: Props = $props();

  const styleAttr = $derived(
    band?.style
      ? Object.entries(band.style)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")
      : undefined,
  );
</script>

<!-- One rendered band: full-bleed section carrying the band's block style and
     optional background media; content sits above the background. -->
<section class="relative isolate w-full" style={styleAttr}>
  {#if band?.background}
    <div class="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Media media={band.background} class="h-full w-full object-cover" />
    </div>
  {/if}
  {@render children()}
</section>
```

- [ ] **Step 4: Run → PASS** (both test files).
- [ ] **Step 5: Commit** — `git add src/lib/blux && git commit -m "feat(blux): Media + SectionBand render primitives"`

---

## Task 3: recursive Grid.svelte

**Files:**

- Create: `src/lib/blux/Grid.svelte`
- Test: `src/lib/blux/Grid.test.ts`

- [ ] **Step 1: Write the failing test:**

```ts
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
          node: { kind: "media", media: { kind: "image", url: "https://cdn/a.jpg" } },
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
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn/a.jpg");
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
          cells: [{ token: { cols: "any" }, node: { kind: "subtitle", text: "s" } }],
        },
      },
    });
    const cell = container.querySelector("[data-grid-cell]") as HTMLElement;
    expect(cell.style.flexBasis).toBe("");
  });
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** `src/lib/blux/Grid.svelte` (recursion via self-import; exhaustive over `RenderNode["kind"]`):

```svelte
<script lang="ts">
  import type { RenderNode } from "./presentation";
  import { cellWidth } from "./presentation";
  import Media from "./Media.svelte";
  import Grid from "./Grid.svelte";

  type Props = { node: RenderNode };
  let { node }: Props = $props();

  const roleClass = (role?: string) => (role ? `txt-role-${role}` : "");
</script>

<!-- Render-faithful fallback: reconstructs a band's parsed node tree.
     HTML strings are baked by our own emit stage — same trust class as
     Prismic rich text. Widgets render a mount placeholder until plan 4. -->
{#if node.kind === "row"}
  <div class="flex w-full flex-wrap" data-grid-row>
    {#each node.cells as cell, i (i)}
      <div
        data-grid-cell
        class="min-w-0 grow"
        style:flex-basis={cellWidth(cell.token) ?? undefined}
      >
        <Grid node={cell.node} />
      </div>
    {/each}
  </div>
{:else if node.kind === "stack"}
  {#each node.children as child, i (i)}
    <Grid node={child} />
  {/each}
{:else if node.kind === "heading"}
  <svelte:element this={`h${node.level}`} class={roleClass(node.role)}
    >{@html node.html}</svelte:element
  >
{:else if node.kind === "body"}
  <div class={roleClass(node.role)}>{@html node.html}</div>
{:else if node.kind === "subtitle"}
  <p class={roleClass(node.role)}>{node.text}</p>
{:else if node.kind === "media"}
  <Media media={node.media} class="h-auto w-full" />
{:else if node.kind === "raw"}
  {@html node.html}
{:else if node.kind === "widget"}
  <div data-widget={node.widget.type} class="min-h-64 w-full"></div>
{/if}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add src/lib/blux && git commit -m "feat(blux): recursive Grid fallback renderer"`

---

## Task 4: GridBand slice (the fallback's Prismic anchor)

**Files:**

- Create: `src/lib/slices/GridBand/model.json`, `src/lib/slices/GridBand/index.svelte`
- Modify: `src/lib/slices/index.js`
- Test: `src/lib/slices/GridBand/GridBand.test.ts`

- [ ] **Step 1: Write the failing test:**

```ts
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import GridBand from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const slice = (band: number) =>
  ({
    slice_type: "grid_band",
    variation: "default",
    primary: { band },
    items: [],
  }) as never;

const presentation: Presentation = {
  bands: {
    "5": {
      style: { "background-color": "rgb(10, 20, 30)" },
      tree: { kind: "heading", level: 3, html: "From the manifest" },
    },
  },
};

describe("GridBand slice", () => {
  it("renders its band tree from context inside a styled SectionBand", () => {
    const { container } = render(GridBand, {
      props: { slice: slice(5), context: { presentation } },
    });
    expect(container.querySelector("h3")?.textContent).toBe("From the manifest");
    expect(container.querySelector("section")?.style.backgroundColor).toBe("rgb(10, 20, 30)");
  });

  it("renders nothing (no crash) when the band has no manifest entry", () => {
    const { container } = render(GridBand, {
      props: { slice: slice(99), context: { presentation } },
    });
    expect(container.querySelector("section")).toBeNull();
  });

  it("tolerates a missing context entirely", () => {
    const { container } = render(GridBand, { props: { slice: slice(5), context: {} } });
    expect(container.querySelector("section")).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement.** `src/lib/slices/GridBand/model.json`:

```json
{
  "id": "grid_band",
  "type": "SharedSlice",
  "name": "GridBand",
  "description": "Render-faithful fallback band — layout tree lives in the presentation manifest",
  "variations": [
    {
      "id": "default",
      "name": "Default",
      "docURL": "...",
      "version": "initial",
      "description": "Band rendered from the blux presentation manifest by band index",
      "imageUrl": "",
      "primary": {
        "band": { "type": "Number", "config": { "label": "band (index from the Blux export)" } }
      },
      "items": {}
    }
  ]
}
```

`src/lib/slices/GridBand/index.svelte`:

```svelte
<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Grid from "$lib/blux/Grid.svelte";

  type Props = {
    slice: { slice_type: string; primary: { band?: number | null } };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();

  const band = $derived(bandFor(context.presentation, slice.primary.band ?? null));
</script>

{#if band?.tree}
  <SectionBand {band}>
    <div class="mx-auto w-full max-w-screen-xl px-6 py-12">
      <Grid node={band.tree} />
    </div>
  </SectionBand>
{:else}
  <!-- grid_band without a manifest entry: nothing to render faithfully. -->
{/if}
```

Register in `src/lib/slices/index.js` (keep the generated file's shape, alphabetical):

```js
import GridBand from "./GridBand/index.svelte";
// … existing imports …

export const components = {
  collection_list: CollectionList,
  grid_band: GridBand,
  hero: Hero,
  media_text: MediaText,
  rich_text: RichText,
  section_grid: SectionGrid,
};
```

(Task 5 adds the other new ids to this map — keep it alphabetical each time.)

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add src/lib/slices/GridBand src/lib/slices/index.js && git commit -m "feat(slices): grid_band render-faithful fallback slice"`

---

## Task 5: pattern slices — TitleBand, SplitFeature, Gallery, MediaFull

**Files:**

- Create: `src/lib/slices/{TitleBand,SplitFeature,Gallery,MediaFull}/{model.json,index.svelte}` + one co-located `*.test.ts` each
- Modify: `src/lib/slices/index.js`

All four follow the same skeleton as GridBand: `band` Number field, `bandFor` lookup, `SectionBand` wrapper (bare `<section>` semantics still fine when `band` is null — SectionBand accepts null). Editable text lives in Prismic fields; media payloads come from the manifest.

- [ ] **Step 1: Write the failing tests** (one file per slice; the SplitFeature one shown in full — mirror its shape for the others):

`src/lib/slices/SplitFeature/SplitFeature.test.ts`:

```ts
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import SplitFeature from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const presentation: Presentation = {
  bands: {
    "1": {
      split: {
        mediaSide: "right",
        ratio: 40,
        media: { kind: "image", url: "https://cdn/split.jpg" },
        text: { kind: "body", html: "<p>Manifest text</p>" },
      },
    },
  },
};

const slice = {
  slice_type: "split_feature",
  variation: "default",
  primary: { band: 1, body: [] },
  items: [],
} as never;

describe("SplitFeature slice", () => {
  it("renders media on the token side at the token ratio, text from the manifest tree", () => {
    const { container } = render(SplitFeature, {
      props: { slice, context: { presentation } },
    });
    const cells = container.querySelectorAll("[data-split-cell]");
    expect(cells).toHaveLength(2);
    // mediaSide right → text first, media second
    expect(cells[0]?.textContent).toContain("Manifest text");
    expect(cells[1]?.querySelector("img")?.getAttribute("src")).toBe("https://cdn/split.jpg");
    expect((cells[1] as HTMLElement).style.flexBasis).toBe("40%");
  });

  it("renders nothing without a manifest split payload", () => {
    const { container } = render(SplitFeature, {
      props: { slice, context: { presentation: { bands: {} } } },
    });
    expect(container.querySelector("[data-split-cell]")).toBeNull();
  });
});
```

Tests for the others (same imports/cleanup):

- **TitleBand** (`title_band`): renders `primary.heading` ("The Space") as an `<h2>` and `primary.subtitle` as a `<p>`; band style from the manifest applies on the `<section>`; renders fine with `context: {}` (Prismic-only, bare section).
- **Gallery** (`gallery`): given manifest `gallery: [img, img, video]` renders 3 `[data-gallery-cell]` children (2 `img` + 1 `video`); renders nothing without the payload.
- **MediaFull** (`media_full`): given manifest `media: {kind:"video",…}` renders one full-width `<video>`; nothing without payload.

- [ ] **Step 2: Run → FAIL** (all four files).
- [ ] **Step 3: Implement.**

`src/lib/slices/TitleBand/model.json`:

```json
{
  "id": "title_band",
  "type": "SharedSlice",
  "name": "TitleBand",
  "description": "Centered band title with optional subtitle",
  "variations": [
    {
      "id": "default",
      "name": "Default",
      "docURL": "...",
      "version": "initial",
      "description": "Heading + optional subtitle",
      "imageUrl": "",
      "primary": {
        "band": { "type": "Number", "config": { "label": "band (index from the Blux export)" } },
        "heading": { "type": "Text", "config": { "label": "heading" } },
        "subtitle": { "type": "Text", "config": { "label": "subtitle" } }
      },
      "items": {}
    }
  ]
}
```

`src/lib/slices/TitleBand/index.svelte`:

```svelte
<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";

  type Props = {
    slice: {
      slice_type: string;
      primary: { band?: number | null; heading?: string | null; subtitle?: string | null };
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(bandFor(context.presentation, slice.primary.band ?? null));
</script>

<SectionBand {band}>
  <div class="mx-auto w-full max-w-screen-xl px-6 py-16 text-center">
    {#if slice.primary.heading}<h2>{slice.primary.heading}</h2>{/if}
    {#if slice.primary.subtitle}<p class="mt-2">{slice.primary.subtitle}</p>{/if}
  </div>
</SectionBand>
```

`src/lib/slices/SplitFeature/model.json` — same envelope with `"id": "split_feature"`, `"name": "SplitFeature"`, primary: `band` Number + `body` StructuredText (`"multi": "paragraph,heading2,heading3,heading4,strong,em,hyperlink"`, label "body (overrides the manifest text when filled)").

`src/lib/slices/SplitFeature/index.svelte`:

```svelte
<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { bandFor, cellWidth, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Grid from "$lib/blux/Grid.svelte";
  import Media from "$lib/blux/Media.svelte";
  import { isFilled } from "@prismicio/client";
  import type { RichTextField } from "@prismicio/client";

  type Props = {
    slice: {
      slice_type: string;
      primary: { band?: number | null; body?: RichTextField | null };
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(bandFor(context.presentation, slice.primary.band ?? null));
  const split = $derived(band?.split ?? null);
</script>

{#if split}
  <SectionBand {band}>
    <div
      class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-y-8 px-6 py-12"
      class:flex-row-reverse={split.mediaSide === "left"}
    >
      <div data-split-cell class="min-w-0 grow" style:flex-basis="{100 - split.ratio}%">
        {#if slice.primary.body && isFilled.richText(slice.primary.body)}
          <PrismicRichText field={slice.primary.body} />
        {:else}
          <Grid node={split.text} />
        {/if}
      </div>
      <div data-split-cell class="min-w-0 grow" style:flex-basis="{split.ratio}%">
        <Media media={split.media} class="h-auto w-full" />
      </div>
    </div>
  </SectionBand>
{/if}
```

> NOTE the DOM-order contract the test pins: text cell first, media cell second, with `flex-row-reverse` when the media belongs on the LEFT. `split.ratio` is the MEDIA cell's share (plan-2 `SplitFeatureSpec`).

`src/lib/slices/Gallery/model.json` — envelope with `"id": "gallery"`, `"name": "Gallery"`, primary: `band` Number only.

`src/lib/slices/Gallery/index.svelte`:

```svelte
<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Media from "$lib/blux/Media.svelte";

  type Props = {
    slice: { slice_type: string; primary: { band?: number | null } };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(bandFor(context.presentation, slice.primary.band ?? null));
  const media = $derived(band?.gallery ?? null);
</script>

{#if media && media.length > 0}
  <SectionBand {band}>
    <div class="mx-auto flex w-full max-w-screen-xl flex-wrap px-6 py-12">
      {#each media as m, i (i)}
        <div data-gallery-cell class="min-w-0 grow" style:flex-basis="{100 / media.length}%">
          <Media media={m} class="h-auto w-full" />
        </div>
      {/each}
    </div>
  </SectionBand>
{/if}
```

`src/lib/slices/MediaFull/model.json` — envelope with `"id": "media_full"`, `"name": "MediaFull"`, primary: `band` Number only.

`src/lib/slices/MediaFull/index.svelte`:

```svelte
<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Media from "$lib/blux/Media.svelte";

  type Props = {
    slice: { slice_type: string; primary: { band?: number | null } };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(bandFor(context.presentation, slice.primary.band ?? null));
</script>

{#if band?.media}
  <SectionBand {band}>
    <Media media={band.media} class="h-auto w-full" />
  </SectionBand>
{/if}
```

Register all four in `src/lib/slices/index.js` (alphabetical: `gallery`, `grid_band`, `media_full`, `split_feature`, `title_band`).

- [ ] **Step 4: Run → PASS** (all four test files + whole suite).
- [ ] **Step 5: Commit** — `git add src/lib/slices && git commit -m "feat(slices): title_band, split_feature, gallery, media_full pattern band slices"`

---

## Task 6: hero `band` variation + rich_text optional band

**Files:**

- Modify: `src/lib/slices/Hero/model.json`, `src/lib/slices/Hero/index.svelte`
- Modify: `src/lib/slices/RichText/model.json`, `src/lib/slices/RichText/index.svelte`
- Test: `src/lib/slices/Hero/HeroBand.test.ts` (new file; do NOT touch any existing Hero test)

- [ ] **Step 1: Read both existing index.svelte files fully.** The guardrail: the `default` variation's rendering must stay byte-identical.

- [ ] **Step 2: Write the failing test** `src/lib/slices/Hero/HeroBand.test.ts`:

```ts
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
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn/hero-bg.jpg");
    expect(container.querySelector("section")?.style.minHeight).toBe("80vh");
  });
});
```

- [ ] **Step 3: Run → FAIL** (variation not handled).

- [ ] **Step 4: Implement.** `Hero/model.json`: append a second variation object to `"variations"`:

```json
{
  "id": "band",
  "name": "Band",
  "docURL": "...",
  "version": "initial",
  "description": "Blux band hero — background from the presentation manifest, overlay text",
  "imageUrl": "",
  "primary": {
    "band": { "type": "Number", "config": { "label": "band (index from the Blux export)" } },
    "heading": { "type": "Text", "config": { "label": "heading" } },
    "subtitle": { "type": "Text", "config": { "label": "subtitle" } },
    "body": { "type": "Text", "config": { "label": "body" } }
  },
  "items": {}
}
```

`Hero/index.svelte`: branch on the variation at the top of the template; the existing markup moves untouched into the `{:else}` arm:

```svelte
{#if slice.variation === "band"}
  <SectionBand band={bandFor(context?.presentation, slice.primary.band ?? null)}>
    <div class="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
      {#if slice.primary.heading}<h2>{slice.primary.heading}</h2>{/if}
      {#if slice.primary.subtitle}<p class="mt-2">{slice.primary.subtitle}</p>{/if}
      {#if slice.primary.body}<p class="mt-4">{slice.primary.body}</p>{/if}
    </div>
  </SectionBand>
{:else}
  <!-- existing default-variation markup, character-for-character -->
{/if}
```

Type note: the slice prop is currently `Content.HeroSlice`; after regenerating types is out of scope, so widen the Props type locally (`slice: Content.HeroSlice` → a union with the band-variation shape, or `slice: Content.HeroSlice & { primary: Record<string, unknown> }` — match the repo's eslint rules, no `any`). Add `context?: { presentation?: Presentation }` to Props (SliceZone always passes it once Task 7 lands; optional so existing tests don't break).

`RichText/model.json`: add `"band": { "type": "Number", "config": { "label": "band (optional — wraps in the Blux SectionBand when set)" } }` to the existing variation's `primary`. `RichText/index.svelte`: when `slice.primary.band` is set AND a manifest entry exists, wrap the existing output in `<SectionBand band={…}>`; otherwise render exactly as today.

- [ ] **Step 5: Run → PASS** (new test + ALL existing Hero/RichText tests untouched and green).
- [ ] **Step 6: Commit** — `git add src/lib/slices/Hero src/lib/slices/RichText && git commit -m "feat(slices): hero band variation + rich_text optional band wrap"`

---

## Task 7: wire SliceZone context + a11y fixtures

**Files:**

- Modify: `src/routes/[[preview=preview]]/+page.svelte`, `src/routes/[[preview=preview]]/[uid]/+page.svelte`, `src/routes/slice-simulator/+page.svelte`
- Modify: `src/routes/dev/a11y-fixtures/+page.svelte`

- [ ] **Step 1:** In both page routes, load the presentation and pass it:

```svelte
<script>
  // … existing imports …
  import { loadPresentation } from "$lib/blux/presentation";
  const presentation = loadPresentation();
</script>

<SliceZone slices={data.page.data.slices} {components} context={{ presentation }} />
```

Same `context={{ presentation }}` on the slice-simulator's `<SliceZone>`.

- [ ] **Step 2:** Add fixtures for the new slices to `src/routes/dev/a11y-fixtures/+page.svelte`, following the existing `CollectionList slice={collectionListFixture} context={collectionCtx}` pattern: one `GridBand` (with a small inline presentation containing a heading + 2-cell row + image), one `TitleBand`, one `SplitFeature`, one `Gallery` (2 images), one `MediaFull` (image), one `Hero` band variation. Define one shared `bluxCtx = { presentation: { bands: { … } } }` fixture object in the page's script. Images can use any existing static asset path already referenced by that page (or a 1×1 data URI).

- [ ] **Step 3:** Run `pnpm test` (everything green) and `pnpm check` (svelte-check clean — this is where context typing mistakes surface).

- [ ] **Step 4: Commit** — `git add src/routes && git commit -m "feat(blux): wire presentation context into SliceZone + a11y fixtures"`

---

## Task 8: full gate + branch hygiene

- [ ] **Step 1:** `pnpm lint` (run `pnpm format` first if prettier complains — new files only).
- [ ] **Step 2:** `pnpm check` → svelte-check clean.
- [ ] **Step 3:** `pnpm test` → whole suite green.
- [ ] **Step 4:** `pnpm build` → vite build clean.
- [ ] **Step 5:** `git status` clean; branch is a stack of small commits.

---

## Self-review checklist (controller, before final review)

- Nothing about the live archetype slices' rendering changed: `hero` default variation byte-identical, `rich_text` renders identically when `band` is absent, `media_text`/`section_grid`/`collection_list` untouched.
- The render-side contract (`presentation.ts` types) is documented field-by-field — plan 5's emit conforms to IT, not vice versa.
- Missing manifest entries degrade gracefully everywhere (no crash, no empty styled band shells).
- `cellWidth`/flex semantics match plan-2's `cellRatio` reading of tokens (ratio → sized → 100/cols; `any` = flex auto).
- All new ids registered in `src/lib/slices/index.js`; a11y fixtures cover every new slice.
- `{@html}` used only for emit-baked strings (heading/body/raw), never for user input.
