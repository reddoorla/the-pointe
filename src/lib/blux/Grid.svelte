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
  <Media media={node.media} class="h-auto w-full" />
{:else if node.kind === "raw"}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html node.html}
{:else if node.kind === "widget"}
  <div data-widget={node.widget.type} class="min-h-64 w-full"></div>
{/if}
