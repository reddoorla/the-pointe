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

<!-- Full-bleed image band. Overlay copy uses the original's hero voice:
     tracked uppercase Montserrat in white, not the display serif. -->
<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="hero-band relative isolate flex min-h-[45vh] items-center justify-center overflow-hidden bg-neutral-900 text-center text-white lg:min-h-[55vh]"
>
  {#if slice.primary.background_image?.url}
    <HeroBackgroundImage
      image={slice.primary.background_image}
      preload={false}
    />
  {/if}
  <div class="hero-copy relative z-10 mx-auto max-w-4xl px-6 py-24">
    <PrismicRichText field={slice.primary.heading} />
    <RichTextBody field={slice.primary.body} />
    {#if slice.primary.cta_label && slice.primary.cta_link}
      <PrismicLink
        field={slice.primary.cta_link}
        class="mt-6 inline-block bg-white px-6 py-3 font-medium text-black"
      >
        {slice.primary.cta_label}
      </PrismicLink>
    {/if}
  </div>
</section>

<!-- The .hero-copy text2 overlay treatment lives in app.css (always loaded). -->
