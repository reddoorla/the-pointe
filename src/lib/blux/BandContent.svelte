<script lang="ts">
  import type { Snippet } from "svelte";
  import type { BandPresentation } from "./presentation";

  // The Blux content column: a max-width box, centered, carrying the band's own
  // side gutters + vertical rhythm (`_contentPadding`, e.g. "100px 4% 100px 4%")
  // and text alignment. Replaces the ad-hoc `max-w-screen-xl px-6 py-N
  // text-center` wrappers so margins/positions match the export's
  // blockcontainer (max-width 1280, 4% gutters) at every viewport. Defaults
  // apply when a band omits a hint.
  type Props = {
    band: BandPresentation | null;
    children: Snippet;
    /** Extra classes on the content box (e.g. z-index for over-background heroes). */
    class?: string;
  };
  let { band, children, class: extra = "" }: Props = $props();

  const maxW = $derived(band?.style?.["_max-content-width"]);
  const pad = $derived(band?.style?.["_contentPadding"]);
  const align = $derived(band?.style?.["text-align"]);
  const style = $derived(
    [
      `max-width:${maxW && maxW !== "none" ? maxW : "1280px"}`,
      "margin-inline:auto",
      `padding:${pad && pad !== "0px" ? pad : "0 4%"}`,
      align ? `text-align:${align}` : "",
    ]
      .filter(Boolean)
      .join(";"),
  );
</script>

<div class="w-full {extra}" {style}>
  {@render children()}
</div>
