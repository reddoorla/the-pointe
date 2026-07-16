<script lang="ts">
  import wordmark from "$lib/assets/tbp-pointe-wordmark.png";
  import tbpLogo from "$lib/assets/tbp-logo.png";
  import linesGlyph from "$lib/assets/tbp-lines.png";

  // Leasing contacts from the original site's footer (Blux export).
  const contacts = [
    {
      name: "Todd Doney",
      tel: "213.613.3330",
      email: "Todd.Doney@cbre.com",
      license: "Lic. 00852254",
    },
    {
      name: "Doug Marlow",
      tel: "818.502.6707",
      email: "Doug.Marlow@cbre.com",
      license: "Lic. 00950434",
    },
  ];
</script>

<!-- Left-aligned like the original's footer (it never centers). -->
<footer id="contact" class="w-full px-8 py-16 mt-auto bg-surface">
  <div class="max-w-4xl mx-auto flex flex-col items-start gap-10 text-left">
    <img src={wordmark} alt="The Pointe" class="h-8 w-auto" />

    <div class="flex flex-col items-start gap-6">
      <div class="flex flex-col gap-2">
        <p class="text-sm uppercase tracking-[0.1em] font-medium">
          Leasing Team
        </p>
        <!-- The original's small decorative lines glyph under the heading. -->
        <img src={linesGlyph} alt="" class="h-auto w-10" />
      </div>
      <div class="flex flex-col sm:flex-row gap-8 sm:gap-16">
        {#each contacts as contact (contact.email)}
          <div class="flex flex-col gap-1">
            <p class="font-medium">{contact.name}</p>
            <a href="tel:{contact.tel.replaceAll('.', '')}">{contact.tel}</a>
            <a href="mailto:{contact.email}">{contact.email}</a>
            <p class="text-sm text-secondary">{contact.license}</p>
          </div>
        {/each}
      </div>
    </div>

    <div
      class="flex flex-col items-start gap-4 pt-6 border-t border-light w-full"
    >
      <p class="text-sm uppercase tracking-[0.1em] font-medium">
        A Property Within
      </p>
      <a href="https://www.theburbankportfolio.com/" class="block">
        <img src={tbpLogo} alt="The Burbank Portfolio" class="h-5 w-auto" />
      </a>
      <!-- solid muted token, not opacity — the navy palette at 60% alpha fails
           WCAG contrast (3.66:1); --color-secondary is chosen to pass (6.09:1) -->
      <p class="text-sm text-secondary">
        &copy; {new Date().getFullYear()} The Pointe
      </p>
    </div>
  </div>
</footer>
