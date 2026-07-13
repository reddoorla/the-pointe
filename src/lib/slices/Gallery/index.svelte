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
    <!-- The source models this as a full-bleed image slider (each frame a
         cover image ~80vh tall). A static reproduction shows the frames as an
         edge-to-edge cover strip: full width, equal thirds, fixed height so
         the large lazy images reserve their box and never collapse. -->
    <div class="flex w-full flex-col sm:flex-row">
      {#each media as m, i (i)}
        <div data-gallery-cell class="min-w-0 flex-1">
          <Media
            media={m}
            class="block h-[48vh] w-full object-cover sm:h-[60vh]"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      {/each}
    </div>
  </SectionBand>
{/if}
