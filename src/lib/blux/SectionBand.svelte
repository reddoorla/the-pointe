<script lang="ts">
  import type { Snippet } from "svelte";
  import type { BandPresentation } from "./presentation";
  import Media from "./Media.svelte";

  type Props = {
    band: BandPresentation | null;
    children: Snippet;
    /** True for the first band: its background image is the likely LCP. */
    eagerBackground?: boolean;
    /** Slice-identity data-attrs, for parity with the generated slice roots. */
    sliceType?: string;
    sliceVariation?: string;
  };
  let {
    band,
    children,
    eagerBackground = false,
    sliceType,
    sliceVariation,
  }: Props = $props();

  const styleAttr = $derived(
    band?.style
      ? Object.entries(band.style)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")
      : undefined,
  );
</script>

<!-- One rendered band: full-bleed section carrying the band's block style and
     optional background media; content sits above the background. -->
<section
  class="relative isolate w-full"
  style={styleAttr}
  data-slice-type={sliceType}
  data-slice-variation={sliceVariation}
>
  {#if band?.background}
    <div class="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Media
        media={band.background}
        class="h-full w-full object-cover"
        loading={eagerBackground ? "eager" : "lazy"}
      />
    </div>
  {/if}
  {@render children()}
</section>
