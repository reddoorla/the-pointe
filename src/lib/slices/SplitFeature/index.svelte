<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Grid from "$lib/blux/Grid.svelte";
  import Media from "$lib/blux/Media.svelte";
  import { isFilled } from "@prismicio/client";
  import type { RichTextField } from "@prismicio/client";

  type Props = {
    slice: {
      slice_type: string;
      variation?: string;
      primary: { band?: number | null; body?: RichTextField | null };
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
  const split = $derived(band?.split ?? null);
</script>

{#if split}
  <SectionBand
    {band}
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    <div
      class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-y-8 px-6 py-12"
      class:flex-row-reverse={split.mediaSide === "left"}
    >
      <div
        data-split-cell
        class="min-w-0 grow basis-full md:basis-(--cell-basis)"
        style:--cell-basis="{100 - split.ratio}%"
      >
        {#if slice.primary.body && isFilled.richText(slice.primary.body)}
          <PrismicRichText field={slice.primary.body} />
        {:else}
          <Grid node={split.text} />
        {/if}
      </div>
      <div
        data-split-cell
        class="min-w-0 grow basis-full md:basis-(--cell-basis)"
        style:--cell-basis="{split.ratio}%"
      >
        <Media media={split.media} class="h-auto w-full" />
      </div>
    </div>
  </SectionBand>
{/if}
