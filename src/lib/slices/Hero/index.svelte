<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";

  interface Props {
    slice: Content.HeroSlice;
  }

  let { slice }: Props = $props();
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden bg-neutral-900 text-center text-white"
>
  {#if slice.primary.background_image?.url}
    <HeroBackgroundImage
      image={slice.primary.background_image}
      preload={false}
    />
  {/if}
  <div class="relative z-10 mx-auto max-w-3xl px-6 py-24">
    <PrismicRichText field={slice.primary.heading} />
    <RichTextBody field={slice.primary.body} />
    {#if slice.primary.cta_label && slice.primary.cta_link}
      <PrismicLink
        field={slice.primary.cta_link}
        class="mt-6 inline-block rounded bg-white px-6 py-3 font-semibold text-black"
      >
        {slice.primary.cta_label}
      </PrismicLink>
    {/if}
  </div>
</section>
