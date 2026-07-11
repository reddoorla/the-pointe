<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import type { Content } from "@prismicio/client";
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";

  // `band` is a new optional Number field not in the generated prismic types
  // yet (regenerating them is out of scope), so intersect it in locally.
  interface Props {
    slice: Content.RichTextSlice & {
      primary: { band?: number | null };
    };
    context?: { presentation?: Presentation };
  }

  let { slice, context = {} }: Props = $props();
  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
</script>

{#snippet content()}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="prose mx-auto px-6 py-12"
  >
    <RichTextBody field={slice.primary.content} />
  </section>
{/snippet}

{#if band}
  <SectionBand {band}>
    {@render content()}
  </SectionBand>
{:else}
  {@render content()}
{/if}
