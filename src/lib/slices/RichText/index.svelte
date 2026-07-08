<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import SectionBand from "$lib/components/SectionBand.svelte";
  import type { Content } from "@prismicio/client";
  import { roleClass, type SliceContext } from "$lib/presentation";

  let {
    slice,
    index,
    context,
  }: {
    slice: Content.RichTextSlice;
    index?: number;
    context?: SliceContext;
  } = $props();

  // The role this block uses (text5 eyebrow, text11/text0 serif display, text14
  // serif body) comes straight from the manifest — no word-count guessing.
  let entry = $derived(
    index != null ? context?.presentation?.get(index) : undefined,
  );
  let role = $derived(
    entry?.presentation?.headingRole ?? entry?.presentation?.bodyRole,
  );
</script>

<!-- Standalone copy blocks are the original's centered section openers and
     interstitial blurbs — centered, on a comfortable measure. The band's
     background/height and the box's max-width/text-align come from the export
     (SectionBand); the text role (via .txt-role-*) decides eyebrow vs serif
     display vs serif body. -->
<SectionBand
  block={entry?.presentation?.block}
  sliceType={slice.slice_type}
  variation={slice.variation}
  contentClass="richtext-block max-w-3xl px-6 py-10 text-center {roleClass(role)}"
>
  <RichTextBody field={slice.primary.content} />
</SectionBand>
