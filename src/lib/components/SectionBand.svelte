<script lang="ts">
  import type { Snippet } from "svelte";
  import { bandStyle, contentStyle } from "$lib/presentation";

  // The shared shell every Blux section renders into: a full-bleed <section>
  // "band" (its background colour / height / vertical-align come from the
  // export via bandStyle) wrapping a centered content box (its max-width and
  // text-align come from contentStyle; the caller supplies the padding and
  // inner layout through contentClass). Both style strings are inline, so they
  // survive this SvelteKit build's unreliable component-<style> loading.
  let {
    block,
    sliceType,
    variation,
    sectionClass = "",
    contentClass = "",
    fallbackHeight,
    background,
    children,
  }: {
    block?: Record<string, string>;
    sliceType?: string;
    variation?: string;
    sectionClass?: string;
    contentClass?: string;
    fallbackHeight?: string;
    background?: Snippet;
    children: Snippet;
  } = $props();
</script>

<section
  data-slice-type={sliceType}
  data-slice-variation={variation}
  class="w-full {sectionClass}"
  style={bandStyle(block, fallbackHeight)}
>
  {@render background?.()}
  <div class="mx-auto w-full {contentClass}" style={contentStyle(block)}>
    {@render children()}
  </div>
</section>
