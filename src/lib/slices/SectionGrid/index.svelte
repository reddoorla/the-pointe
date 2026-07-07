<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import {
    PrismicImage,
    PrismicLink,
    PrismicRichText,
  } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";

  interface Props {
    slice: Content.SectionGridSlice;
  }

  let { slice }: Props = $props();
  let columns = $derived(slice.primary.columns ?? 3);
  const colClass: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="mx-auto max-w-6xl px-6 py-12"
>
  <PrismicRichText field={slice.primary.heading} />
  <div
    data-grid-columns={columns}
    class="mt-8 grid grid-cols-1 gap-8 {colClass[columns] ?? 'md:grid-cols-3'}"
  >
    {#each slice.items as item (item)}
      <PrismicLink field={item.item_link} class="block">
        {#if item.item_media?.url}
          <PrismicImage
            field={item.item_media}
            class="mb-3 h-auto w-full rounded"
          />
        {/if}
        <PrismicRichText field={item.item_heading} />
        <RichTextBody field={item.item_body} />
      </PrismicLink>
    {/each}
  </div>
</section>
