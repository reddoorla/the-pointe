<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";

  // The `band` variation is not in the generated prismic types yet
  // (regenerating them is out of scope), so widen the slice union locally.
  type HeroBandSlice = {
    slice_type: "hero";
    variation: "band";
    primary: {
      band?: number | null;
      heading?: string | null;
      subtitle?: string | null;
      body?: string | null;
    };
    items: unknown[];
  };

  interface Props {
    slice: Content.HeroSlice | HeroBandSlice;
    context?: { presentation?: Presentation };
  }

  let { slice, context = {} }: Props = $props();
</script>

{#if slice.variation === "band"}
  <SectionBand
    band={bandFor(context?.presentation, slice.primary.band ?? null)}
    eagerBackground
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    <div class="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
      {#if slice.primary.heading}<h2>{slice.primary.heading}</h2>{/if}
      {#if slice.primary.subtitle}<p class="mt-2">
          {slice.primary.subtitle}
        </p>{/if}
      {#if slice.primary.body}<p class="mt-4">{slice.primary.body}</p>{/if}
    </div>
  </SectionBand>
{:else}
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
{/if}
