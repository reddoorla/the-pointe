<script lang="ts">
  import type { RenderNode, MapRenderConfig } from "./presentation";
  import { rowCellBases } from "./presentation";
  import Media from "./Media.svelte";
  import LocationMap from "./LocationMap.svelte";
  import Grid from "./Grid.svelte";

  type Props = { node: RenderNode; map?: MapRenderConfig };
  let { node, map }: Props = $props();

  const roleClass = (role?: string) => (role ? `txt-role-${role}` : "");

  // A text leaf's role class plus the style deviations the export carries on it.
  // color/padding (and any other keys) apply inline at every width; margin-right
  // is desktop-only in the source (reset ≤800px), so it rides a `--node-mr`
  // custom property consumed by the md:-scoped `mr-(--node-mr)` class — never an
  // unconditional inline margin that would leak onto mobile.
  const textStyle = (role?: string, style?: Record<string, string>) => {
    const mr = style?.["margin-right"];
    const decls = style
      ? Object.entries(style)
          .filter(([k]) => k !== "margin-right")
          .map(([k, v]) => `${k}:${v}`)
      : [];
    if (mr) decls.push(`--node-mr:${mr}`);
    return {
      class: [roleClass(role), mr ? "md:mr-(--node-mr)" : ""]
        .filter(Boolean)
        .join(" "),
      style: decls.length ? decls.join(";") : undefined,
    };
  };

  // A container node (row/stack) may carry a "card" background — a Blux
  // `.blocks0` wrapper's inline background-color the emit stage threaded onto
  // the node when it peeled the wrapper. Applied inline so the fill sits behind
  // the whole box (e.g. band 3's white stats card).
  const containerStyle = (style?: Record<string, string>) =>
    style
      ? Object.entries(style)
          .map(([k, v]) => `${k}:${v}`)
          .join(";")
      : undefined;
</script>

<!-- Render-faithful fallback: reconstructs a band's parsed node tree.
     HTML strings are baked by our own emit stage — same trust class as
     Prismic rich text. A widget:map mounts the real LocationMap when a
     map config is threaded down from the band; other widget types still
     render a mount placeholder. -->
{#if node.kind === "row"}
  {@const bases = rowCellBases(node.cells)}
  <!-- gap-y spaces rows that wrap to their own line (stacked media/text bands
       and mobile) with Blux's inter-block rhythm. md:gap-x-[4%] is Blux's
       column gutter between side-by-side cells (md: up); it's reserved back out
       of each cell's basis by rowCellBases (calc(basis - share%)) so the columns
       still fit one flex line instead of the last cell wrapping. Keep the 4%
       here in sync with GRID_GUTTER in presentation.ts. -->
  <div
    class="flex w-full flex-wrap gap-y-10 md:gap-x-[4%]"
    style={containerStyle(node.style)}
    data-grid-row
  >
    {#each node.cells as cell, i (i)}
      <div
        data-grid-cell
        class="min-w-0 grow basis-full md:basis-(--cell-basis)"
        style:--cell-basis={bases[i] ?? "auto"}
      >
        <Grid node={cell.node} {map} />
      </div>
    {/each}
  </div>
{:else if node.kind === "stack"}
  <!-- Blux stacks its block elements with vertical rhythm between them; the
       flat stack rendered them flush. A modest column gap restores it. A stack
       may also carry a card background (a peeled `.blocks0` wrapper's fill). -->
  <div class="flex flex-col gap-6" style={containerStyle(node.style)}>
    {#each node.children as child, i (i)}
      <Grid node={child} {map} />
    {/each}
  </div>
{:else if node.kind === "heading"}
  {@const ts = textStyle(node.role, node.style)}
  <svelte:element
    this={`h${Math.min(Math.max(node.level, 1), 6)}`}
    class={ts.class}
    style={ts.style}
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html node.html}
  </svelte:element>
{:else if node.kind === "body"}
  {@const ts = textStyle(node.role, node.style)}
  <div class={ts.class} style={ts.style}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html node.html}
  </div>
{:else if node.kind === "subtitle"}
  {@const ts = textStyle(node.role, node.style)}
  <p class={ts.class} style={ts.style}>{node.text}</p>
{:else if node.kind === "media"}
  <!-- Media follows inherited text-align: an `inline-block` image inside a
       full-width block wrapper, positioned by the ancestor's text-align — Blux
       `.ib{display:inline-block}` graphics are never force-centered. Intrinsic
       width still caps to the cell so rules/logos keep their true size. -->
  <div class="w-full">
    <Media media={node.media} class="inline-block h-auto max-w-full" />
  </div>
{:else if node.kind === "raw"}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html node.html}
{:else if node.kind === "widget"}
  {#if node.widget.type === "map" && map}
    <LocationMap {map} />
  {:else}
    <div data-widget={node.widget.type} class="min-h-64 w-full"></div>
  {/if}
{/if}
