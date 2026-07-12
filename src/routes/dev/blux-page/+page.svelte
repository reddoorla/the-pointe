<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";
  import slices from "$lib/blux/page-slices.json";

  const presentation = loadPresentation();
</script>

<SliceZone slices={slices as never} {components} context={{ presentation }} />
