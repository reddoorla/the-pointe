<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
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
</script>

<!-- Full-bleed image band. Overlay copy uses whatever role the export assigns
     the hero title (text2 "Page Title" on thePointe), applied via .txt-role-*;
     white comes from the section, which the role class doesn't touch. -->
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
  <div class="relative z-10 mx-auto max-w-4xl px-6 py-24">
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
  </div>
</section>
