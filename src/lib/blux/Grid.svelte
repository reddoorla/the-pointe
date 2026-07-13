<script lang="ts">
  import type { RenderNode, MapRenderConfig } from "./presentation";
  import { cellWidth } from "./presentation";
  import Media from "./Media.svelte";
  import LocationMap from "./LocationMap.svelte";
  import Grid from "./Grid.svelte";

  type Props = { node: RenderNode; map?: MapRenderConfig };
  let { node, map }: Props = $props();

  const roleClass = (role?: string) => (role ? `txt-role-${role}` : "");
</script>

<!-- Render-faithful fallback: reconstructs a band's parsed node tree.
     HTML strings are baked by our own emit stage — same trust class as
     Prismic rich text. A widget:map mounts the real LocationMap when a
     map config is threaded down from the band; other widget types still
     render a mount placeholder. -->
{#if node.kind === "row"}
  <!-- gap-y spaces rows that wrap to their own line (stacked media/text bands
       and mobile) with Blux's inter-block rhythm; side-by-side cell pairs sit
       on one flex line so it doesn't affect their horizontal spacing. -->
  <div class="flex w-full flex-wrap gap-y-10" data-grid-row>
    {#each node.cells as cell, i (i)}
      <div
        data-grid-cell
        class="min-w-0 grow basis-full md:basis-(--cell-basis)"
        style:--cell-basis={cellWidth(cell.token) ?? "auto"}
      >
        <Grid node={cell.node} {map} />
      </div>
    {/each}
  </div>
{:else if node.kind === "stack"}
  <!-- Blux stacks its block elements with vertical rhythm between them; the
       flat stack rendered them flush. A modest column gap restores it. -->
  <div class="flex flex-col gap-6">
    {#each node.children as child, i (i)}
      <Grid node={child} {map} />
    {/each}
  </div>
{:else if node.kind === "heading"}
  <svelte:element
    this={`h${Math.min(Math.max(node.level, 1), 6)}`}
    class={roleClass(node.role)}
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html node.html}
  </svelte:element>
{:else if node.kind === "body"}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <div class={roleClass(node.role)}>{@html node.html}</div>
{:else if node.kind === "subtitle"}
  <p class={roleClass(node.role)}>{node.text}</p>
{:else if node.kind === "media"}
  <!-- Render at the image's intrinsic width (capped to the cell), not forced
       full-bleed: Blux uses small graphics as horizontal rules/logos that must
       NOT stretch. Photos are intrinsically large and still fill. Exact source
       widths land once the emit stage threads them into the manifest. -->
  <Media media={node.media} class="mx-auto block h-auto max-w-full" />
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
