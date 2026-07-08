<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";
  import { roleClass, type SliceContext } from "$lib/presentation";

  let {
    slice,
    index,
    context,
  }: {
    slice: Content.MediaTextSlice;
    index?: number;
    context?: SliceContext;
  } = $props();
  let reverse = $derived(slice.variation === "imageLeft");
  let hasHeading = $derived(isFilled.richText(slice.primary.heading));
  let hasBody = $derived(isFilled.richText(slice.primary.body));
  let hasMedia = $derived(isFilled.image(slice.primary.media));
  let mediaOnly = $derived(hasMedia && !hasHeading && !hasBody);

  let entry = $derived(
    index != null ? context?.presentation?.get(index) : undefined,
  );
  let headingRole = $derived(entry?.presentation?.headingRole);
  let bodyRole = $derived(entry?.presentation?.bodyRole);
</script>

{#if mediaOnly}
  <!-- A row with only an image is a full-bleed feature photo, centered — not an
       editorial split with an empty copy column beside it. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto max-w-5xl px-6 py-16"
  >
    <PrismicImage field={slice.primary.media} class="mx-auto h-auto w-full" />
  </section>
{:else}
  <!-- Photo-dominant editorial row: copy ~1/3, image ~2/3, alternating sides
       down the page (see app.css `nth-child(even of …)` rule). The heading and
       body each carry the text role the export assigned them (a heading-less
       row's body is typically the text14 serif blurb). -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-12"
  >
    <div
      class="mt-copy {hasMedia
        ? 'lg:col-span-4'
        : 'text-center lg:col-span-8 lg:col-start-3'} {reverse
        ? 'lg:order-2'
        : ''}"
    >
      {#if hasHeading}
        <div class={roleClass(headingRole)}>
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      <div class={roleClass(bodyRole)}>
        <RichTextBody field={slice.primary.body} />
      </div>
    </div>
    {#if hasMedia}
      <div class="mt-media lg:col-span-8 {reverse ? 'lg:order-1' : ''}">
        <PrismicImage field={slice.primary.media} class="h-auto w-full" />
      </div>
    {/if}
  </section>
{/if}

<!-- The .serif-blurb text14 treatment lives in app.css (always loaded). -->
