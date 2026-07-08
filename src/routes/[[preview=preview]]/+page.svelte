<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { pagePresentation } from "$lib/presentation";

  let { data } = $props();

  // Per-slice presentation from the Blux styles manifest, keyed by slice index.
  // SliceZone hands this to every slice as `context`; each reads its own entry.
  let presentation = $derived(pagePresentation(data.page.uid));
</script>

<SliceZone
  slices={data.page.data.slices}
  {components}
  context={{ presentation }}
/>
