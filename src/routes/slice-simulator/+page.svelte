<script lang="ts">
  import { SliceSimulator } from "@slicemachine/adapter-sveltekit/simulator";
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";

  const presentation = loadPresentation();
</script>

<!-- Slot syntax is used for backward compatibility with Svelte <=4. -->
<SliceSimulator let:slices>
  <SliceZone {slices} {components} context={{ presentation }} />
</SliceSimulator>
