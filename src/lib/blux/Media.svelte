<script lang="ts">
  import type { RenderMedia } from "./presentation";

  type Props = { media: RenderMedia; class?: string };
  let { media, class: passedClasses = "" }: Props = $props();
</script>

{#if media.kind === "video"}
  <!-- Ambient loop, muted so autoplay is allowed everywhere. -->
  <video
    src={media.url}
    class={passedClasses}
    autoplay
    loop
    muted
    playsinline
    preload="metadata"
  ></video>
{:else}
  <img
    src={media.url}
    alt={media.alt ?? ""}
    loading="lazy"
    class={passedClasses}
  />
{/if}
