<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import SectionBand from "$lib/components/SectionBand.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";
  import { roleClass, type SliceContext } from "$lib/presentation";

  let {
    slice,
    index,
    context,
  }: {
    slice: Content.HeroSlice;
    index?: number;
    context?: SliceContext;
  } = $props();

  let entry = $derived(
    index != null ? context?.presentation?.get(index) : undefined,
  );
  let headingRole = $derived(entry?.presentation?.headingRole);
  let bodyRole = $derived(entry?.presentation?.bodyRole);
  let hasImage = $derived(!!slice.primary.background_image?.url);
</script>

<!-- Full-bleed image band. Height / vertical-align / text-align come from the
     export (SectionBand); when the block gives no height we still stand a
     background-image hero 45vh tall so the photo shows. Overlay copy uses
     whatever role the export assigns the hero title (text2 "Page Title" on
     thePointe), applied via .txt-role-*; white comes from the section class,
     which the role class doesn't touch. -->
<SectionBand
  block={entry?.presentation?.block}
  sliceType={slice.slice_type}
  variation={slice.variation}
  fallbackHeight={hasImage ? "45vh" : undefined}
  sectionClass="hero-band relative isolate overflow-hidden bg-neutral-900 text-white"
  contentClass="relative z-10 max-w-4xl px-6 py-24 text-center"
>
  {#snippet background()}
    {#if hasImage}
      <HeroBackgroundImage
        image={slice.primary.background_image}
        preload={false}
      />
    {/if}
  {/snippet}
  <div class={roleClass(headingRole)}>
    <PrismicRichText field={slice.primary.heading} />
  </div>
  <div class={roleClass(bodyRole)}>
    <RichTextBody field={slice.primary.body} />
  </div>
  {#if slice.primary.cta_label && slice.primary.cta_link}
    <PrismicLink
      field={slice.primary.cta_link}
      class="mt-6 inline-block bg-white px-6 py-3 font-medium text-black"
    >
      {slice.primary.cta_label}
    </PrismicLink>
  {/if}
</SectionBand>
