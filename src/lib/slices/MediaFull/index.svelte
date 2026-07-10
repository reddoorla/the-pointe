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
</script>

{#if band?.media}
  <SectionBand {band}>
    <Media media={band.media} class="h-auto w-full" />
  </SectionBand>
{/if}
