<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { asText, type Content } from "@prismicio/client";

  interface Props {
    slice: Content.RichTextSlice;
  }

  let { slice }: Props = $props();

  // The export renders rich_text content in Martel serif throughout (text11
  // "Page Title Serif" for openers, text14 "Body Serif" for blurbs). A short
  // single line is a section opener → display scale; anything longer is a
  // blurb → serif body scale. Word count cleanly separates them in the data
  // (openers ≤6 words, blurbs ≥9).
  let isOpener = $derived(
    asText(slice.primary.content).trim().split(/\s+/).filter(Boolean).length <=
      6,
  );
</script>

<!-- Standalone copy blocks are the original's centered section openers and
     interstitial blurbs — centered, on a comfortable measure. No `prose`: it
     overrode the Martel-serif roles (text11/text14) these blocks use. -->
<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="richtext-block mx-auto max-w-3xl px-6 py-10 text-center"
  class:richtext-opener={isOpener}
>
  <RichTextBody field={slice.primary.content} />
</section>

<!-- The .richtext-block paragraph rhythm lives in app.css (always loaded). -->
