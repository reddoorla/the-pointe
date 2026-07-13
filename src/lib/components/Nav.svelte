<script lang="ts">
  import { Menu, X } from "@lucide/svelte";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { fade } from "$lib/transitions";
  import wordmark from "$lib/assets/tbp-pointe-wordmark.png";

  interface NavLink {
    text: string;
    href: string;
  }

  interface Props {
    navLinks?: NavLink[];
  }

  // Placeholder styling — restyle per project. Pass `navLinks` to get inline
  // links on desktop and a focus-trapped full-screen menu on mobile; omit it
  // for a logo-only bar.
  let { navLinks = [] }: Props = $props();

  let isMenuOpen = $state(false);
  let openButtonEl = $state<HTMLButtonElement>();

  const openMenu = () => (isMenuOpen = true);
  const closeMenu = () => (isMenuOpen = false);
</script>

<!-- Faithful to the original: a solid white bar (page background is #edeff4, not
     white) with the logo + links inset to the content gutter, links in the
     original's muted slate. -->
<nav class="fixed top-0 left-0 z-50 w-full bg-white py-9">
  <div
    class="mx-auto flex w-full max-w-[1150px] items-center justify-between px-6 lg:px-0"
  >
    <a href="/" class="block">
      <img src={wordmark} alt="The Pointe — home" class="h-7 w-auto" />
    </a>

    {#if navLinks.length > 0}
      <div class="hidden items-center gap-9 text-[#4b4b6e] lg:flex">
        {#each navLinks as link (link.href)}
          <a
            href={link.href}
            class="text-inherit no-underline transition-opacity hover:opacity-70"
            >{link.text}</a
          >
        {/each}
      </div>

      {#if !isMenuOpen}
        <button
          bind:this={openButtonEl}
          type="button"
          class="flex min-h-11 min-w-11 items-center justify-center text-[#4b4b6e] lg:hidden"
          onclick={openMenu}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      {/if}
    {/if}
  </div>
</nav>

{#if isMenuOpen}
  <!-- The open trigger above unmounts while the menu is open, so the element
       trapFocus captured is detached by close time — `restoreFocus` hands it
       the re-mounted trigger instead. -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
    class="fixed inset-0 z-50 h-dvh w-screen bg-background flex flex-col items-center justify-center gap-8 lg:hidden"
    transition:fade
    use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
  >
    <button
      type="button"
      class="absolute top-4 right-8 flex items-center justify-center min-h-11 min-w-11"
      onclick={closeMenu}
      aria-label="Close menu"
    >
      <X size={24} />
    </button>

    {#each navLinks as link (link.href)}
      <a href={link.href} class="py-3 px-4" onclick={closeMenu}>{link.text}</a>
    {/each}
  </div>
{/if}
