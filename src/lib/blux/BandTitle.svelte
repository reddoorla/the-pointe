<script lang="ts">
  // Title/hero band heading, faithful to the Blux original's two-line title
  // pattern: a small uppercase eyebrow label (role text5) sitting above a large
  // Martel display line (role text12). The `heading` field carries the eyebrow
  // and `subtitle` the display line — the export models it that way, so the
  // visually-dominant display line becomes the semantic <h2>. A band with only
  // a heading (the closing CTA) renders as the mid-size text11 display.
  //
  // The role ids are hard-coded here to match this page; once the emit stage
  // threads per-line roles into the presentation manifest, read them from there.
  type Props = { heading?: string | null; subtitle?: string | null };
  let { heading, subtitle }: Props = $props();
</script>

{#if subtitle}
  {#if heading}<p class="txt-role-text5 mb-4">{heading}</p>{/if}
  <!-- Honor the source's hard line breaks (Blux `<br>` in the display title),
       carried as newlines. HTML-escaped interpolation keeps this safe. -->
  <h2 class="txt-role-text12">
    {#each subtitle.split("\n") as line, i}{#if i}<br />{/if}{line}{/each}
  </h2>
{:else if heading}
  <h2 class="txt-role-text11">{heading}</h2>
{/if}
