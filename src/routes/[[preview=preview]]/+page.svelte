<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";

  let { data } = $props();

  const presentation = loadPresentation();
</script>

<SliceZone
  slices={data.page.data.slices}
  {components}
  context={{ presentation }}
/>
