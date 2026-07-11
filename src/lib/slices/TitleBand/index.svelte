<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";

  type Props = {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        band?: number | null;
        heading?: string | null;
        subtitle?: string | null;
      };
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();
  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
</script>

<SectionBand
  {band}
  sliceType={slice.slice_type}
  sliceVariation={slice.variation}
>
  <div class="mx-auto w-full max-w-screen-xl px-6 py-16 text-center">
    {#if slice.primary.heading}<h2>{slice.primary.heading}</h2>{/if}
    {#if slice.primary.subtitle}<p class="mt-2">
        {slice.primary.subtitle}
      </p>{/if}
  </div>
</SectionBand>
