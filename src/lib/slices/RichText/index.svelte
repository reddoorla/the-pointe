<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
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
     interstitial blurbs — centered, on a comfortable measure. The text role
     (applied via .txt-role-*) decides eyebrow vs serif display vs serif body. -->
<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="richtext-block mx-auto max-w-3xl px-6 py-10 text-center {roleClass(
    role,
  )}"
>
  <RichTextBody field={slice.primary.content} />
</section>
