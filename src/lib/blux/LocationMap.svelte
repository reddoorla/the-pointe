<script lang="ts">
  // Interactive pinned map from the Blux export (plan 4). Recreates the
  // original clickMap semantics: radio-style chips where exactly one group is
  // active, and group 0's layers (the portfolio) are never removed from the
  // map. Initial framing comes from the KML bounds — the initially-visible
  // layer has preserveViewport false — so center/zoom are optional hints.
  import type { MapRenderConfig } from "./presentation";
  import { loadMapsApi, type GLayer, type GMapsNS } from "./maps-loader";

  type Props = { map: MapRenderConfig };
  let { map: config }: Props = $props();

  const key: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  let mountEl: HTMLDivElement | undefined = $state();
  let active = $state(0);
  let gmap: unknown;
  const layerObjs: Record<string, GLayer> = {};

  function applyToggle(next: number, prev: number) {
    const off = config.toggles[prev];
    const on = config.toggles[next];
    // The original's "off" handler keeps group 0 (the portfolio) on the map.
    if (prev !== 0) off?.layers.forEach((n) => layerObjs[n]?.setMap(null));
    on?.layers.forEach((n) => layerObjs[n]?.setMap(gmap));
  }

  function select(i: number) {
    if (i === active) return; // re-applying would re-fetch the KML (flicker)
    const prev = active;
    active = i;
    if (gmap) applyToggle(i, prev);
  }

  $effect(() => {
    if (!key || !mountEl) return;
    let cancelled = false;
    loadMapsApi(key)
      .then((g: GMapsNS) => {
        if (cancelled || !mountEl) return;
        gmap = new g.Map(mountEl, {
          ...(config.center ? { center: config.center } : {}),
          ...(config.zoom !== undefined ? { zoom: config.zoom } : {}),
          styles: config.styles,
        });
        for (const l of config.layers) {
          layerObjs[l.name] = new g.KmlLayer({
            url: `https://www.google.com/maps/d/u/0/kml?forcekmz=1&mid=${encodeURIComponent(config.mid)}&lid=${encodeURIComponent(l.lid)}`,
            preserveViewport: l.preserveViewport,
            map: l.initiallyVisible ? gmap : null,
          });
        }
        // Catch up on a chip clicked while the API was still loading; prev=0
        // skips the off pass, preserving the portfolio quirk.
        if (active !== 0) applyToggle(active, 0);
      })
      .catch(() => {
        // Accepted degraded state: the map div stays blank, chips stay inert.
      });
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="w-full">
  {#if key}
    <div bind:this={mountEl} style:height="600px" class="w-full"></div>
  {:else}
    <!-- No Maps key in this environment (dev/test): keep the layout, skip the API. -->
    <div
      data-map-placeholder
      style:height="600px"
      class="w-full bg-neutral-100"
    ></div>
  {/if}
  {#if config.toggles.length > 0}
    <div class="mt-6 flex flex-wrap gap-3">
      {#each config.toggles as t, i (i)}
        <button
          type="button"
          aria-pressed={active === i}
          class="border px-3 py-1 text-sm"
          onclick={() => select(i)}
        >
          {t.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
