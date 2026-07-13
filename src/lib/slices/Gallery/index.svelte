<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
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
</script>

{#if media && media.length > 0}
  <SectionBand
    {band}
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
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
  </SectionBand>
{/if}
