<script module lang="ts">
  import type { RenderMedia } from "./presentation";

  /** One rendered slide: manifest media + caption text (zipped from the
   * Prismic slice's items by the caller) + the caption's txt-role. */
  export type CarouselFrame = {
    media: RenderMedia;
    caption?: string;
    role?: string;
  };
</script>

<script lang="ts">
  import Slider from "$lib/components/Slider.svelte";
  import Media from "./Media.svelte";

  let { frames, label }: { frames: CarouselFrame[]; label: string } = $props();
</script>

<!-- The source slider shows one full-bleed cover frame at a time with prev/next
     arrows and NO dots or autoplay (the export encodes none) — mirror exactly. -->
<Slider itemCount={frames.length} {label} showDots={false} class="w-full">
  {#snippet children({ index }: { index: number })}
    {@const frame = frames[index]}
    {#if frame}
      <figure
        class="relative w-full"
        style={`min-height:${frame.media.minHeight ?? "60vh"}`}
      >
        <Media
          media={frame.media}
          class="absolute inset-0 h-full w-full object-cover"
        />
        {#if frame.caption}
          <!-- The source caption card: white, centered on the frame, 15px/30px padding. -->
          <figcaption class="absolute inset-0 flex items-center justify-center">
            <span
              class={`bg-white px-[30px] py-[15px] text-center ${frame.role ? `txt-role-${frame.role}` : ""}`}
              >{frame.caption}</span
            >
          </figcaption>
        {/if}
      </figure>
    {/if}
  {/snippet}
</Slider>
