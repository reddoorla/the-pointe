<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import SectionBand from "$lib/components/SectionBand.svelte";
  import {
    PrismicImage,
    PrismicLink,
    PrismicRichText,
  } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";
  import { roleClass, type SliceContext } from "$lib/presentation";

  let {
    slice,
    index,
    context,
  }: {
    slice: Content.SectionGridSlice;
    index?: number;
    context?: SliceContext;
  } = $props();
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

  // Each item's text role (text5 eyebrow vs text11 serif headline, …) comes
  // from the manifest, aligned by item index. Augment the items with their
  // role BEFORE the layout split so the role survives the filtering below.
  let entry = $derived(
    index != null ? context?.presentation?.get(index) : undefined,
  );
  let items = $derived(
    (slice.items as Item[]).map((item, i) => ({
      item,
      headingRole: entry?.items?.[i]?.headingRole,
      bodyRole: entry?.items?.[i]?.bodyRole,
    })),
  );

  // Four layouts, chosen by what the items carry (mirrors the original's
  // archetypes): all bare images → tile strip; all image+text → card grid;
  // text plus bare-image items → magazine split; no bare-image items → copy.
  let textItems = $derived(
    items.filter((a) => hasText(a.item) || !hasMedia(a.item)),
  );
  let mediaItems = $derived(
    items.filter((a) => hasMedia(a.item) && !hasText(a.item)),
  );
  let mode = $derived(
    items.length > 0 && items.every((a) => hasMedia(a.item) && !hasText(a.item))
      ? "tiles"
      : items.length > 0 &&
          items.every((a) => hasMedia(a.item) && hasText(a.item))
        ? "cards"
        : mediaItems.length === 0
          ? "copy"
          : "split",
  );
  // Small images (rule ornaments, logos) render at natural size; photos fill.
  const isSmall = (i: Item) => (i.item_media?.dimensions?.width ?? 9999) < 480;
</script>

<SectionBand
  block={entry?.presentation?.block}
  sliceType={slice.slice_type}
  variation={slice.variation}
  contentClass="max-w-7xl px-6 py-16"
>
  {#if isFilled.richText(slice.primary.heading)}
    <div
      class="mb-10 text-center {roleClass(entry?.presentation?.headingRole)}"
    >
      <PrismicRichText field={slice.primary.heading} />
    </div>
  {/if}

  {#if mode === "tiles"}
    <div class="grid grid-cols-2 gap-6 md:grid-cols-3">
      {#each items as { item } (item)}
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
      {#each items as { item, headingRole, bodyRole } (item)}
        <PrismicLink field={item.item_link} class="block">
          <PrismicImage
            field={item.item_media}
            class="mb-4 aspect-[4/3] w-full object-cover"
          />
          <div class={roleClass(headingRole)}>
            <PrismicRichText field={item.item_heading} />
          </div>
          <div class={roleClass(bodyRole)}>
            <RichTextBody field={item.item_body} />
          </div>
        </PrismicLink>
      {/each}
    </div>
  {:else if mode === "copy"}
    <div class="flex max-w-3xl flex-col gap-6">
      {#each textItems as { item, headingRole, bodyRole } (item)}
        <div>
          <div class={roleClass(headingRole)}>
            <PrismicRichText field={item.item_heading} />
          </div>
          <div class={roleClass(bodyRole)}>
            <RichTextBody field={item.item_body} />
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
      <div class="flex flex-col gap-6 lg:col-span-5">
        {#each textItems as { item, headingRole, bodyRole } (item)}
          <div>
            <div class={roleClass(headingRole)}>
              <PrismicRichText field={item.item_heading} />
            </div>
            {#if hasMedia(item)}
              <PrismicImage
                field={item.item_media}
                class="mt-2 h-auto w-auto"
              />
            {/if}
            <div class={roleClass(bodyRole)}>
              <RichTextBody field={item.item_body} />
            </div>
          </div>
        {/each}
      </div>
      <div class="flex flex-col gap-10 lg:col-span-7">
        {#each mediaItems as { item }, i (item)}
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
</SectionBand>
