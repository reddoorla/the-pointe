// jsdom ships no `matchMedia`. Some libraries (notably `svelte/motion`, whose
// `Tween`/`tweened` reads `prefers-reduced-motion` when the module loads) call
// it at import time — before any test's beforeEach can stub it. Provide a
// default here so importing such a module never throws. Tests that need to
// drive reduced-motion still reassign `window.matchMedia` in beforeEach.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
