// Render-side contract for the Blux faithful-grid pipeline (plan 3 of
// reddoor-maintenance docs/superpowers/specs/2026-07-08-blux-faithful-grid-slices-design.md).
// The emit stage (plan 5) writes blux-presentation.json: per-band presentation
// (style record, background media, Grid fallback trees, media payloads) keyed
// by band index. Pattern-slice TEXT stays CMS-editable in Prismic; this module
// carries everything Prismic's flat model can't.
import manifest from "./blux-presentation.json";

export type RenderMedia = {
  kind: "image" | "video";
  /** Absolute URL (Prismic CDN after emit). */
  url: string;
  alt?: string;
  /** Source display width in px (Blux inline `width`). Rendered capped to 100%
   * so in-flow images match the original instead of stretching full-bleed. */
  width?: number;
  /** Aspect ratio as height/width percentage (Blux `mediaRatio`/`data-og-ratio`). */
  aspect?: number;
  /** Source `background-size` intent. A band background's `auto` = a native-size
   * decorative accent (→ object-fit:none), not a full-bleed `cover`. */
  fit?: "contain" | "cover" | "auto";
  /** A band background's `background-position` (e.g. "right bottom") so a
   * corner-anchored accent isn't centered. */
  position?: string;
  /** The source holder's inline min-height (e.g. "80vh" on slider slides), so
   * a cover-frame carousel reserves the original's height. */
  minHeight?: string;
  /** A `<video>`'s source playback attributes; present-only. Absent = an ambient
   * background loop; `controls` = user-initiated inline playback. */
  playback?: {
    controls?: boolean;
    playsinline?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  /** Per-frame caption (gallery slides carry a title in the source slider). */
  caption?: string;
};

export type GridToken = {
  cols: number | "any";
  ratio?: number;
  /** Grid inter-cell spacing in px (Blux `grid-N-sM`). A gap, not a width. */
  spacing?: number;
};

export type RenderNode =
  | { kind: "row"; cells: RenderCell[] }
  | { kind: "stack"; children: RenderNode[] }
  | {
      kind: "heading";
      level: number;
      html: string;
      role?: string;
      /** Inline deviations the export carries on the text leaf (color, padding)
       * plus decoded margin utilities (margin-20r → margin-right:20%). The
       * margin-right percentage is desktop-only in the source (reset ≤800px) —
       * the render scopes it to md+. */
      style?: Record<string, string>;
    }
  | {
      kind: "body";
      html: string;
      role?: string;
      /** Inline deviations the export carries on the text leaf (color, padding)
       * plus decoded margin utilities (margin-20r → margin-right:20%). The
       * margin-right percentage is desktop-only in the source (reset ≤800px) —
       * the render scopes it to md+. */
      style?: Record<string, string>;
    }
  | {
      kind: "subtitle";
      text: string;
      role?: string;
      /** Inline deviations the export carries on the text leaf (color, padding)
       * plus decoded margin utilities (margin-20r → margin-right:20%). The
       * margin-right percentage is desktop-only in the source (reset ≤800px) —
       * the render scopes it to md+. */
      style?: Record<string, string>;
    }
  | { kind: "media"; media: RenderMedia }
  | { kind: "raw"; html: string }
  | { kind: "widget"; widget: { type: "map" } };

export type RenderCell = { token: GridToken; node: RenderNode };

export type MapLayer = {
  name: string;
  lid: string;
  initiallyVisible: boolean;
  preserveViewport: boolean;
};
export type MapToggle = { label: string; layers: string[] };
export type MapRenderConfig = {
  mid: string;
  layers: MapLayer[];
  toggles: MapToggle[];
  styles: unknown[];
  center?: { lat: number; lng: number };
  zoom?: number;
};

export type BandPresentation = {
  /** The band's source index, stamped by `bandFor` (not from the manifest) so
   * the band <section> can carry an `id` for the nav's section anchors. */
  index?: number;
  /** CSS property → value, applied inline on the band <section>. */
  style?: Record<string, string>;
  /** Band-level background media, rendered behind the content box. */
  background?: RenderMedia;
  /** Grid fallback: the band's whole serialized node tree. */
  tree?: RenderNode;
  /** SplitFeature payload (text side may contain nested media — render recursively). */
  split?: {
    mediaSide: "left" | "right";
    ratio: number;
    media: RenderMedia;
    text: RenderNode;
  };
  /** Gallery payload. */
  gallery?: RenderMedia[];
  /** Carousel payload: the band is a source slider (.caslider). Caption TEXT
   * lives in the page doc's items (Prismic-editable); the manifest carries the
   * media and the caption's role metadata. `columns` = slides visible at once
   * (source data-columns). */
  carousel?: {
    slides: {
      media: RenderMedia;
      caption?: { level?: number; role?: string };
    }[];
    columns?: number;
  };
  /** MediaFull payload. */
  media?: RenderMedia;
  /** LocationMap payload (plan 4). */
  map?: MapRenderConfig;
};

export type Presentation = { bands: Record<string, BandPresentation> };

export function loadPresentation(): Presentation {
  return manifest as Presentation;
}

/** The presentation entry for a band index, or null. Tolerates an absent
 * presentation entirely (SliceZone context not wired, simulator, tests). */
export function bandFor(
  presentation: Presentation | undefined,
  band: number | null | undefined,
): BandPresentation | null {
  if (!presentation || band === null || band === undefined) return null;
  const entry = presentation.bands?.[String(band)];
  // Stamp the index so the <section> can expose it as an anchor target.
  return entry ? { ...entry, index: band } : null;
}

/** A cell's CSS width from its grid token; null = let flex distribute. Width
 * comes from an explicit `ratio` or an equal split of the column count;
 * `spacing` is a gap, never a width, so a 1-column `grid-1-s40` stat list
 * stacks full-width instead of collapsing to a spacing-derived phantom width. */
export function cellWidth(token: GridToken): string | null {
  if (typeof token.ratio === "number") return `${token.ratio}%`;
  // Covers "any" plus malformed cols (0, negative) that would yield Infinity%.
  if (typeof token.cols !== "number" || token.cols <= 0) return null;
  return `${Math.round((100 / token.cols) * 10000) / 10000}%`;
}
