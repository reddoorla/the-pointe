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
  /** Source `background-size` intent. */
  fit?: "contain" | "cover";
};

export type GridToken = {
  cols: number | "any";
  ratio?: number;
  sized?: number;
};

export type RenderNode =
  | { kind: "row"; cells: RenderCell[] }
  | { kind: "stack"; children: RenderNode[] }
  | { kind: "heading"; level: number; html: string; role?: string }
  | { kind: "body"; html: string; role?: string }
  | { kind: "subtitle"; text: string; role?: string }
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
  return presentation.bands?.[String(band)] ?? null;
}

/** A cell's CSS width from its grid token; null = let flex distribute. */
export function cellWidth(token: GridToken): string | null {
  if (typeof token.ratio === "number") return `${token.ratio}%`;
  if (typeof token.sized === "number") return `${token.sized}%`;
  // Covers "any" plus malformed cols (0, negative) that would yield Infinity%.
  if (typeof token.cols !== "number" || token.cols <= 0) return null;
  return `${Math.round((100 / token.cols) * 10000) / 10000}%`;
}
