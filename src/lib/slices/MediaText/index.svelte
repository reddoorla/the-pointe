<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";

  interface Props {
    slice: Content.MediaTextSlice;
  }

  let { slice }: Props = $props();
  let reverse = $derived(slice.variation === "imageLeft");
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 md:flex-row {reverse
    ? 'md:flex-row-reverse'
    : ''}"
>
  <div class="prose flex-1">
    <PrismicRichText field={slice.primary.heading} />
    <RichTextBody field={slice.primary.body} />
  </div>
  {#if slice.primary.media?.url}
    <div class="flex-1">
      <PrismicImage field={slice.primary.media} class="h-auto w-full rounded" />
    </div>
  {/if}
</section>
