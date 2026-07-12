# Blux Grid Plan 7 — the-pointe faithful-grid render integration

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Make the-pointe render the faithful converted page from plan 5's emit output — drop in the real `blux-presentation.json` + page slice zone, wire the co-located Google Map to actually mount, register the band slices in the page custom type, and prove fidelity with a local (no-Prismic) render + screenshots — leaving only the live Prismic `migrate` + visual sign-off for the operator.

**Architecture:** the-pointe's page render already splits cleanly — the **slice zone** comes from Prismic (`getByUID("page")`) but the **presentation manifest** is a local bundled JSON (`loadPresentation()` → `src/lib/blux/blux-presentation.json`) attached as `SliceZone` context; each band slice reads its band by `primary.band`. So a full converted-page render needs zero Prismic if we feed `SliceZone` a committed slice array. Plan 5's `blux convert` already produced both halves. This plan drops them in, fixes the one render gap (`Grid.svelte` renders a `widget:map` as an inert placeholder — it must mount `<LocationMap>`), and adds a local dev route + screenshot harness.

**Tech Stack:** SvelteKit 5 + `@prismicio/svelte` `SliceZone`, the plan 3/4 render layer (`src/lib/blux/` — `presentation.ts`, `Grid.svelte`, `SectionBand.svelte`, `Media.svelte`, `LocationMap.svelte`, `maps-loader.ts`), Vitest + Testing-Library (component tests), Playwright/chromium (a11y + screenshots), Vite dev on port 5173.

**Repo:** worktree `/Users/tuckerlemos/Documents/GitHub/pointe-plan7`, branch `feat/blux-grid-render` off `origin/main` (`5873dfb` = plan 4B). All work + commits here.

---

## The real converted artifacts (from `blux convert ~/Desktop/thePointe`)

Regenerated from `reddoor-maintenance` `origin/main` (plan 5). 16 bands / 16 slices:

| slices (in order) | manifest band payload |
| --- | --- |
| 0 `grid_band` · 3,4,5,6,9,10,11,12 `grid_band` · **14 `grid_band`** | `tree` (+`style`, some `background`); **band 14 also has `map`** + a `widget:map` node in its tree |
| 1 `split_feature` | `split` |
| 2,13,15 `title_band` | `style` only (text is in the slice `primary.heading`/`subtitle`) |
| 7 `hero`/`band` | `style` + `background` (text in slice primary) |
| 8 `gallery` | `gallery[]` |

- **No `location_map`/`media_full`/`rich_text` slices** — the map is co-located inside band 14's `grid_band` (`bands["14"].map` + a `widget:map` tree node), NOT a standalone slice.
- Page-doc slice `primary` fields carry **no Prismic markers** (all `band` + plain `Text` for hero/title). So the slice array renders directly with no marker resolution.
- All 50 media are **CloudFront CDN urls** (pre-migrate) — they load directly in a local render.
- Map payload (`bands["14"].map`): `mid`, 8 layers, 4 toggles, 27 styles, center, zoom (no `mountId` — that's in `map-config.json`).

---

## File Structure

**Create (the-pointe):**
- `src/lib/blux/page-slices.json` — the committed slice-zone array (`documents[0].data.slices` from the convert output), for the local dev render.
- `src/routes/dev/blux-page/+page.svelte` — local full-page render (no `+page.server.ts` → no Prismic).
- `tests/blux-page.spec.ts` — Playwright: navigate `/dev/blux-page`, capture full + segmented screenshots.

**Modify:**
- `src/lib/blux/blux-presentation.json` — replace the empty `{"bands":{}}` with the real manifest.
- `src/lib/blux/Grid.svelte` — accept + thread a `map` prop; mount `<LocationMap>` for a `widget:map`.
- `src/lib/slices/GridBand/index.svelte` — pass `map={band.map}` into `Grid`.
- `src/lib/blux/Grid.test.ts` — keep the placeholder test, add a map-mount case.
- `src/lib/slices/GridBand/GridBand.test.ts` — add a co-located-map integration case.
- `customtypes/page/index.json` — add the 6 band slices to the Main slice-zone `choices`.
- `src/prismicio-types.d.ts` — regenerate (Slice Machine) so the slices union includes the band slices (typecheck).

**Do NOT touch:** the production page routes (`src/routes/[[preview=preview]]/…`), `LocationMap.svelte`/`maps-loader.ts` (reused as-is), the other slice components.

**Out of scope (operator, after this plan):** the live `blux migrate` (Prismic **write token** → pushes the band-slice page doc, uploads media, Prismic-hosts it by rewriting the manifest urls), publishing the migration release, and the deploy-preview visual sign-off. This plan stops at a committed, locally-verified branch + a screenshot set.

---

## Task 1: Drop the converted artifacts into the-pointe

**Why:** the manifest is the render source of truth; `page-slices.json` is the local stand-in for the Prismic slice zone.

**Files:** Modify `src/lib/blux/blux-presentation.json`; Create `src/lib/blux/page-slices.json`.

- [ ] **Step 1: Regenerate the artifacts from `reddoor-maintenance` `origin/main`.**

A detached worktree at `origin/main` is already set up at `/Users/tuckerlemos/Documents/GitHub/rm-main-convert` (deps installed). From it, run convert against the real export (tsx opens an IPC unix socket that the sandbox blocks — this command needs the sandbox disabled):

```bash
cd /Users/tuckerlemos/Documents/GitHub/rm-main-convert
pnpm tsx src/cli/bin.ts blux convert /Users/tuckerlemos/Desktop/thePointe --out /tmp/pointe-convert-v2
```
Expected: `Converted 16 bands → /tmp/pointe-convert-v2 (16 manifest bands, 16 slices, map config extracted)`.

- [ ] **Step 2: Copy the manifest + extract the slice zone.**

```bash
cp /tmp/pointe-convert-v2/blux-presentation.json /Users/tuckerlemos/Documents/GitHub/pointe-plan7/src/lib/blux/blux-presentation.json
# page-slices.json = the page document's slice zone
node -e 'const p=require("/tmp/pointe-convert-v2/migration-plan.json"); require("fs").writeFileSync("/Users/tuckerlemos/Documents/GitHub/pointe-plan7/src/lib/blux/page-slices.json", JSON.stringify(p.documents[0].data.slices, null, 2)+"\n")'
```

- [ ] **Step 3: Verify the drop.**

```bash
cd /Users/tuckerlemos/Documents/GitHub/pointe-plan7
node -e 'const m=require("./src/lib/blux/blux-presentation.json"); const s=require("./src/lib/blux/page-slices.json"); console.log("bands", Object.keys(m.bands).length, "slices", s.length, "band14.map", !!m.bands["14"]?.map, "band14.tree", !!m.bands["14"]?.tree, "types", [...new Set(s.map(x=>x.slice_type+"/"+x.variation))].join(","))'
```
Expected: `bands 16 slices 16 band14.map true band14.tree true types grid_band/default,split_feature/default,title_band/default,hero/band,gallery/default`. If band count ≠ 16 or `band14.map` is false, STOP — the convert output is wrong.

- [ ] **Step 4: Commit.**

```bash
git add src/lib/blux/blux-presentation.json src/lib/blux/page-slices.json
git commit -m "feat(blux): drop the-pointe converted manifest + page slice zone (plan 5 output)"
```

---

## Task 2: `Grid.svelte` mounts the co-located map (`widget:map` → `<LocationMap>`)

**Why:** the map lives inside band 14's grid tree as a `widget:map` node; `Grid.svelte` renders it as an inert `data-widget` placeholder today. It must mount the real `<LocationMap>` using the band's `map` config — and because `Grid` is recursive and the widget sits inside a `stack`, the `map` prop must be threaded through BOTH recursive calls.

**Files:** Modify `src/lib/blux/Grid.svelte`, `src/lib/slices/GridBand/index.svelte`, `src/lib/blux/Grid.test.ts`, `src/lib/slices/GridBand/GridBand.test.ts`.

- [ ] **Step 1: Write the failing tests.**

In `src/lib/blux/Grid.test.ts` — KEEP the existing placeholder test (widget node, no `map` prop → `[data-widget='map']` present). ADD:

```ts
it("mounts LocationMap for a widget:map when a map config is provided", () => {
  const node = { kind: "stack", children: [{ kind: "widget", widget: { type: "map" } }] } as const;
  const map = { mid: "M", layers: [], toggles: [], styles: [] };
  const { container } = render(Grid, { props: { node, map } });
  // keyless (no VITE_GOOGLE_MAPS_KEY in jsdom) → LocationMap renders its placeholder,
  // and the inert grid widget placeholder is gone.
  expect(container.querySelector("[data-map-placeholder]")).not.toBeNull();
  expect(container.querySelector("[data-widget='map']")).toBeNull();
});
```

In `src/lib/slices/GridBand/GridBand.test.ts` — ADD an integration case (model it on the existing GridBand test + `src/lib/slices/LocationMap/LocationMap.test.ts`):

```ts
it("mounts the map for a grid band whose tree carries a widget:map + map payload", () => {
  const presentation = {
    bands: {
      "9": {
        tree: { kind: "stack", children: [{ kind: "widget", widget: { type: "map" } }, { kind: "body", html: "<p>addr</p>" }] },
        map: { mid: "M", layers: [], toggles: [], styles: [] },
      },
    },
  };
  const slice = { slice_type: "grid_band", variation: "default", primary: { band: 9 } };
  const { container } = render(GridBand, { props: { slice, context: { presentation } } });
  expect(container.querySelector("[data-map-placeholder]")).not.toBeNull();
});
```

- [ ] **Step 2: Run — verify they fail.**

`pnpm vitest run src/lib/blux/Grid.test.ts src/lib/slices/GridBand/GridBand.test.ts` → the two new cases FAIL (placeholder still rendered, no map-placeholder).

- [ ] **Step 3: Implement `Grid.svelte`.**

- Add the prop + import (keep the existing `node` prop):
```svelte
  import type { RenderNode, MapRenderConfig } from "./presentation";
  import { cellWidth } from "./presentation";
  import Media from "./Media.svelte";
  import LocationMap from "./LocationMap.svelte";
  import Grid from "./Grid.svelte";

  type Props = { node: RenderNode; map?: MapRenderConfig };
  let { node, map }: Props = $props();
```
- Thread `{map}` through BOTH recursions:
  - row cell: `<Grid node={cell.node} {map} />`
  - stack child: `<Grid node={child} {map} />`
- Replace the widget arm:
```svelte
{:else if node.kind === "widget"}
  {#if node.widget.type === "map" && map}
    <LocationMap {map} />
  {:else}
    <div data-widget={node.widget.type} class="min-h-64 w-full"></div>
  {/if}
{/if}
```
(Update the stale header comment "until plan 4" → note the map now mounts when a config is threaded in.)

- [ ] **Step 4: Implement `GridBand/index.svelte`** — pass the band's map into Grid:
```svelte
      <Grid node={band.tree} map={band.map} />
```

- [ ] **Step 5: Run — verify pass + no regressions.**

`pnpm vitest run src/lib/blux src/lib/slices/GridBand` → all green (old placeholder test still passes because bare `Grid` with no `map` prop keeps the placeholder). Then `pnpm vitest run` (full unit suite) → green.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/blux/Grid.svelte src/lib/slices/GridBand/index.svelte src/lib/blux/Grid.test.ts src/lib/slices/GridBand/GridBand.test.ts
git commit -m "feat(blux): Grid mounts LocationMap for a co-located widget:map (threaded map prop)"
```

---

## Task 3: Local dev render route + screenshot harness

**Why:** prove the converted page renders faithfully with zero Prismic, and produce screenshots for the operator's fidelity sign-off. The route is byte-for-byte the production render path minus the server fetch.

**Files:** Create `src/routes/dev/blux-page/+page.svelte`, `tests/blux-page.spec.ts`.

- [ ] **Step 1: Add the dev route** `src/routes/dev/blux-page/+page.svelte` (NO `+page.server.ts`):

```svelte
<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";
  import slices from "$lib/blux/page-slices.json";
  const presentation = loadPresentation();
</script>

<SliceZone {slices} {components} context={{ presentation }} />
```
> If TS complains about the JSON import's shape against `SliceZone`'s expected slice type, cast: `slices={slices as never}` (this is a dev-only fixture route). Confirm `$lib/slices` exports `components` and the import style matches the production `+page.svelte`.

- [ ] **Step 2: Manual smoke — run the dev server + eyeball once.**

```bash
pnpm vite:dev   # port 5173; do NOT use `pnpm dev` (that also starts slicemachine)
```
Open `http://localhost:5173/dev/blux-page`. Confirm: the page renders a stacked magazine layout (not a blank page), the hero/gallery/split bands show images, band 14 shows the map area (a neutral placeholder locally — no Maps key). Kill the server when done (`pkill -f "vite dev"` — never leave a zombie dev server).

- [ ] **Step 3: Add a Playwright screenshot spec** `tests/blux-page.spec.ts`:

```ts
import { test } from "@playwright/test";

test("converted the-pointe — full page + segments", async ({ page }) => {
  await page.goto("/dev/blux-page");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/converted-full.png", fullPage: true });
  // segmented shots (fullPage screenshots downscale badly) — one per band section
  const bands = page.locator("[data-slice-type], section");
  const n = await bands.count();
  for (let i = 0; i < n; i++) {
    await bands.nth(i).scrollIntoViewIfNeeded();
    await bands.nth(i).screenshot({ path: `screenshots/band-${String(i).padStart(2, "0")}.png` }).catch(() => {});
  }
});
```
> Confirm the section selector against the rendered DOM (SectionBand emits `data-slice-type`; adjust if the band wrapper differs). Add `screenshots/` to `.gitignore` if it isn't already (don't commit binaries unless the repo does).

- [ ] **Step 4: Capture the screenshots.**

```bash
pnpm exec playwright test tests/blux-page.spec.ts --project=chromium
```
(Playwright's `webServer` auto-starts `vite:dev` and `reuseExistingServer` locally.) Confirm `screenshots/converted-full.png` + per-band shots exist and are non-trivial in size.

- [ ] **Step 5: Commit** (the route + spec; screenshots stay untracked unless the repo commits such artifacts):

```bash
git add src/routes/dev/blux-page/+page.svelte tests/blux-page.spec.ts .gitignore
git commit -m "test(blux): local dev render route + screenshot harness for the converted page"
```

---

## Task 4: Register the band slices in the page custom type

**Why:** the runtime SliceZone resolves via the JS `components` registry (already complete), so local render works without this — but the Prismic **editor + Slice Machine push** gate on the page type's slice-zone `choices`, and the operator's live `migrate` pushes a doc whose slices must be allowed. Also fixes the stale generated types so `typecheck` passes.

**Files:** Modify `customtypes/page/index.json`; regenerate `src/prismicio-types.d.ts`.

- [ ] **Step 1: Add the 6 band slices to the choices.** In `customtypes/page/index.json` → `Main.slices.config.choices`, add each as `{ "type": "SharedSlice" }`: `grid_band`, `title_band`, `split_feature`, `gallery`, `media_full`, `location_map`. (Leave `hero` — its `band` variation is gated at the slice level, already present. Keep the existing 5 choices.)

- [ ] **Step 2: Regenerate the Prismic types** so the `PageDocumentDataSlicesSlice` union includes the band slices:

```bash
pnpm exec slicemachine-cli --help 2>/dev/null || cat package.json | grep -i slicemachine
# use the repo's codegen script — likely `pnpm slicemachine` or a types-gen script; run the one that regenerates src/prismicio-types.d.ts WITHOUT needing Prismic auth.
```
> If regenerating requires Prismic auth / a running Slice Machine the sandbox can't provide, DO NOT hand-edit the "DO NOT EDIT" file blindly. Instead: report BLOCKED on the type regen, leave `customtypes` updated, and note that `typecheck` may flag the band slices in the page union until the operator regenerates during the migrate step. The dev route imports `page-slices.json` untyped, so the render + its tests are unaffected either way.

- [ ] **Step 3: Verify.**

`pnpm typecheck` → clean (or, if Step 2 was BLOCKED, note the specific known type gap and that it does not affect runtime/tests).

- [ ] **Step 4: Commit.**

```bash
git add customtypes/page/index.json src/prismicio-types.d.ts 2>/dev/null
git commit -m "feat(blux): register grid band slices in the page custom type choices"
```

---

## Task 5: Verify + open the PR (teed up for the operator's live migrate)

**Files:** none new — verification + PR.

- [ ] **Step 1: Full gates.**

```bash
cd /Users/tuckerlemos/Documents/GitHub/pointe-plan7
pnpm lint && pnpm typecheck && pnpm vitest run && pnpm build && pnpm test:a11y
```
Expected: all green. `test:a11y` runs axe on `/dev/a11y-fixtures` + `/dev/animate-in`; if you want the converted page a11y-checked too, add `/dev/blux-page` to `tests/a11y.spec.ts`'s goto list (optional — flag any real contrast failures on the converted content rather than silencing them).

- [ ] **Step 2: Push + open a PR** (mark it clearly operator-action-pending):

```bash
git push -u origin feat/blux-grid-render
gh pr create --base main --title "feat(blux): the-pointe faithful-grid render (plan 7) — local-verified, awaiting live migrate" --body "<summary + screenshots note + the operator TODO: run blux migrate with the Prismic write token, publish the release, sign off on the deploy preview>"
```

- [ ] **Step 3: Hand-off note for the operator (put in the PR body):**
  1. The page renders locally at `/dev/blux-page` (screenshots attached) with zero Prismic.
  2. To go live: from `reddoor-maintenance` `main`, `blux convert ~/Desktop/thePointe --out <dir>` then `PRISMIC_REPOSITORY_NAME=the-pointe PRISMIC_WRITE_TOKEN=… blux migrate <dir>` — this pushes the band-slice page doc, uploads the 50 media assets, and rewrites `<dir>/blux-presentation.json`'s urls to Prismic. Copy that rewritten manifest over `src/lib/blux/blux-presentation.json`, then **publish the migration release** in the Prismic dashboard.
  3. Set `VITE_GOOGLE_MAPS_KEY` on the-pointe's Netlify (all contexts) so the map renders live (already set per prior plans — confirm).
  4. Visual sign-off on the deploy preview vs `www.thepointeburbank.com`.

---

## Notes / risks

- **Local map renders as a placeholder** (no `VITE_GOOGLE_MAPS_KEY` in dev) — that's expected and correct; the real map only appears with the key set (Netlify). The screenshot check verifies the map *section* is present + sized, not the live tiles.
- **Some media may be missing** — the convert diagnostics flag unresolved assets (mostly library assets, not this page's rendered media, which resolved via `data-base`). Note any visibly-missing images in the sign-off; a fully-resolved set may need a probe pass (a plan-5 follow-up), not this plan.
- **`page-slices.json` is a local render fixture**, not shipped to production — the production page reads its slices from Prismic after the operator's migrate. Keep it in `src/lib/blux/` for the dev route only.
