<script lang="ts">
  import type { Snippet } from "svelte";
  import type { BandPresentation } from "./presentation";
  import Media from "./Media.svelte";

  type Props = { band: BandPresentation | null; children: Snippet };
  let { band, children }: Props = $props();

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
<section class="relative isolate w-full" style={styleAttr}>
  {#if band?.background}
    <div class="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Media media={band.background} class="h-full w-full object-cover" />
    </div>
  {/if}
  {@render children()}
</section>
