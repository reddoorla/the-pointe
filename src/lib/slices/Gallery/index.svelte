<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import Media from "$lib/blux/Media.svelte";

  type Props = {
    slice: { slice_type: string; primary: { band?: number | null } };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
  const media = $derived(band?.gallery ?? null);
</script>

{#if media && media.length > 0}
  <SectionBand {band}>
    <div class="mx-auto flex w-full max-w-screen-xl flex-wrap px-6 py-12">
      {#each media as m, i (i)}
        <div
          data-gallery-cell
          class="min-w-0 grow"
          style:flex-basis="{100 / media.length}%"
        >
          <Media media={m} class="h-auto w-full" />
        </div>
      {/each}
    </div>
  </SectionBand>
{/if}
