<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import BandContent from "$lib/blux/BandContent.svelte";
  import CarouselFrames, {
    type CarouselFrame,
  } from "$lib/blux/CarouselFrames.svelte";
  import Media from "$lib/blux/Media.svelte";

  type Props = {
    slice: {
      slice_type: string;
      variation?: string;
      primary: { band?: number | null };
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
  const media = $derived(band?.gallery ?? null);
  // Slider frames carry per-slide captions in the source. When present we can't
  // reduce the band to a single cover frame without dropping copy, so render the
  // frames as a captioned grid (image + caption per cell) inside the band's
  // content box. Caption-less galleries keep the full-bleed single-frame view.
  const captioned = $derived(!!media?.some((m) => m.caption));
  // Transition: the live Prismic doc still types band 8 as `gallery` (see
  // 37310f0 — the /#8 prerender anchor needs this slice rendering id=8).
  // When the manifest carries the carousel payload, render the true slider
  // here; caption text comes from the coexisting gallery frames. Once the
  // doc is migrated to the carousel slice type, this mode and the gallery
  // payload can be dropped.
  const carouselFrames = $derived(
    band?.carousel
      ? band.carousel.slides.map((s, i): CarouselFrame => {
          const caption = band.gallery?.[i]?.caption;
          return {
            media: s.media,
            ...(caption ? { caption } : {}),
            ...(s.caption?.role ? { role: s.caption.role } : {}),
          };
        })
      : null,
  );
</script>

{#if media && media.length > 0}
  <SectionBand
    {band}
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    {#if carouselFrames && carouselFrames.length > 0}
      <CarouselFrames frames={carouselFrames} label="Photo slideshow" />
    {:else if captioned}
      <BandContent {band}>
        <div class="flex w-full flex-wrap gap-y-8">
          {#each media as frame, i (i)}
            <div class="min-w-0 grow basis-full md:basis-1/3">
              <Media media={frame} class="block h-auto w-full" />
              {#if frame.caption}
                <p class="txt-role-text5 mt-4">{frame.caption}</p>
              {/if}
            </div>
          {/each}
        </div>
      </BandContent>
    {:else}
      <!-- The source is a full-bleed image slider showing ONE ~80vh cover frame
           at a time. We have no slider runtime, so we render the first frame
           full-bleed at 80vh to match the original's default view and height.
           Frames 1+ stay in the manifest for a future true-slider enhancement. -->
      <div data-gallery-cell class="w-full">
        <Media
          media={media[0]}
          class="block h-[80vh] w-full object-cover"
          loading="eager"
        />
      </div>
    {/if}
  </SectionBand>
{/if}
