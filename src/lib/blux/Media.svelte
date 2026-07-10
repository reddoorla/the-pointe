<script lang="ts">
  import type { RenderMedia } from "./presentation";

  type Props = {
    media: RenderMedia;
    class?: string;
    /** Eager for above-the-fold/LCP images; lazy everywhere else. */
    loading?: "lazy" | "eager";
  };
  let { media, class: passedClasses = "", loading = "lazy" }: Props = $props();

  let videoEl: HTMLVideoElement | undefined = $state();

  // The global CSS reduce block can't stop <video autoplay loop>; gate
  // playback client-side like the repo's other motion (VimeoBanner, Slider).
  $effect(() => {
    if (
      videoEl &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      videoEl.pause();
    }
  });
</script>

{#if media.kind === "video"}
  <!-- Ambient loop, muted so autoplay is allowed everywhere. -->
  <video
    bind:this={videoEl}
    src={media.url}
    class={passedClasses}
    autoplay
    loop
    muted
    playsinline
    preload="metadata"
  ></video>
{:else}
  <img src={media.url} alt={media.alt ?? ""} {loading} class={passedClasses} />
{/if}
