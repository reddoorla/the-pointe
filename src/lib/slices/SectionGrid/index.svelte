<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import {
    PrismicImage,
    PrismicLink,
    PrismicRichText,
  } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";

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

  type Item = Content.SectionGridSliceDefaultItem;
  const hasText = (i: Item) =>
    isFilled.richText(i.item_heading) || isFilled.richText(i.item_body);
  const hasMedia = (i: Item) => isFilled.image(i.item_media);

  // Four layouts, chosen by what the items actually carry (mirrors the
  // original's section archetypes):
  // - every item is a bare image        → logo/photo tile strip
  // - every item is image + text        → uniform card grid
  // - text plus bare-image items        → magazine split: copy column beside
  //                                       a staggered image column
  // - no bare-image items at all        → plain copy stack (captions/labels)
  // An item carrying BOTH text and an image inside a split is an eyebrow with
  // its rule ornament — it belongs in the copy column at natural size.
  let items = $derived(slice.items as Item[]);
  let textItems = $derived(items.filter((i) => hasText(i) || !hasMedia(i)));
  let mediaItems = $derived(items.filter((i) => hasMedia(i) && !hasText(i)));
  let mode = $derived(
    items.length > 0 && items.every((i) => hasMedia(i) && !hasText(i))
      ? "tiles"
      : items.length > 0 && items.every((i) => hasMedia(i) && hasText(i))
        ? "cards"
        : mediaItems.length === 0
          ? "copy"
          : "split",
  );
  // Small images (rule ornaments, logos) render at natural size; photos fill.
  const isSmall = (i: Item) => (i.item_media?.dimensions?.width ?? 9999) < 480;
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="mx-auto max-w-7xl px-6 py-16"
>
  {#if isFilled.richText(slice.primary.heading)}
    <div class="mb-10 text-center">
      <PrismicRichText field={slice.primary.heading} />
    </div>
  {/if}

  {#if mode === "tiles"}
    <div class="grid grid-cols-2 gap-6 md:grid-cols-3">
      {#each items as item (item)}
        <PrismicLink
          field={item.item_link}
          class="flex items-center justify-center bg-surface p-8"
        >
          <PrismicImage
            field={item.item_media}
            class="max-h-16 w-auto object-contain"
          />
        </PrismicLink>
      {/each}
    </div>
  {:else if mode === "cards"}
    <div
      data-grid-columns={columns}
      class="grid grid-cols-1 gap-10 {colClass[columns] ?? 'md:grid-cols-3'}"
    >
      {#each items as item (item)}
        <PrismicLink field={item.item_link} class="block">
          <PrismicImage
            field={item.item_media}
            class="mb-4 aspect-[4/3] w-full object-cover"
          />
          <div class="eyebrow">
            <PrismicRichText field={item.item_heading} />
          </div>
          <RichTextBody field={item.item_body} />
        </PrismicLink>
      {/each}
    </div>
  {:else if mode === "copy"}
    <div class="flex max-w-3xl flex-col gap-6">
      {#each textItems as item (item)}
        <div class="eyebrow">
          <PrismicRichText field={item.item_heading} />
          <RichTextBody field={item.item_body} />
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
      <div class="flex flex-col gap-6 lg:col-span-5">
        {#each textItems as item (item)}
          <!-- In a magazine split the ornament-bearing label is the eyebrow
               (text5); a text-only item is the serif headline (text11). Use
               class: directives so Svelte keeps the scoped rules (a dynamic
               class={} expression gets pruned as "unused"). -->
          <div class:eyebrow={hasMedia(item)} class:headline={!hasMedia(item)}>
            <PrismicRichText field={item.item_heading} />
            {#if hasMedia(item)}
              <PrismicImage
                field={item.item_media}
                class="mt-2 h-auto w-auto"
              />
            {/if}
            <RichTextBody field={item.item_body} />
          </div>
        {/each}
      </div>
      <div class="flex flex-col gap-10 lg:col-span-7">
        {#each mediaItems as item, i (item)}
          <PrismicImage
            field={item.item_media}
            class="h-auto {isSmall(item) ? 'w-auto' : 'w-full'} {i % 2 === 1
              ? 'lg:ml-12 lg:max-w-[85%]'
              : ''}"
          />
        {/each}
      </div>
    </div>
  {/if}
</section>

<!-- The .eyebrow / .headline text-role treatments live in app.css (always
     loaded); slice component styles load unreliably for dynamic slices. -->
