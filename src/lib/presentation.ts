import manifest from "./blux-presentation.json";

/** A block's captured style hints (subset of what the export carries). */
export interface BlockPresentation {
  headingRole?: string;
  bodyRole?: string;
  headingStyle?: Record<string, string>;
  bodyStyle?: Record<string, string>;
  block?: Record<string, string>;
}

export interface SliceEntry {
  index: number;
  sliceType: string;
  presentation?: BlockPresentation;
  items?: (BlockPresentation | null)[];
}

/** Passed to every slice as SliceZone's `context`. */
export interface SliceContext {
  presentation: Map<number, SliceEntry>;
}

interface PagePresentation {
  pageUid: string;
  slices: SliceEntry[];
}

/** Presentation for one page, keyed by the slice's position in the slice zone.
 * The manifest is emitted from the same ordered slice list the migration
 * pushes, so a slice's render index matches its manifest index — until someone
 * manually reorders slices in Prismic, at which point re-run `blux emit`. */
export function pagePresentation(uid: string): Map<number, SliceEntry> {
  const page = (manifest as unknown as PagePresentation[]).find(
    (p) => p.pageUid === uid,
  );
  const map = new Map<number, SliceEntry>();
  if (page) for (const s of page.slices) map.set(s.index, s);
  return map;
}

/** The CSS class that applies a text role's font, or "" when none is known
 * (the element keeps the base heading/body default). */
export function roleClass(role: string | undefined): string {
  return role ? `txt-role-${role}` : "";
}

const VALIGN: Record<string, string> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

/** Inline style for a section's full-bleed *band* (the part that spans the
 * viewport): its background colour and, when the export gave the block a
 * height, a min-height flex column that positions the content by the block's
 * vertical-align. `fallbackHeight` lets a caller (the hero) stay tall enough
 * for its background image when the block itself sets no height — a captured
 * height always wins. Returns "" when the block styles nothing. */
export function bandStyle(
  block?: Record<string, string>,
  fallbackHeight?: string,
): string {
  const out: string[] = [];
  const bg = block?.["background-color"];
  if (bg) out.push(`background-color: ${bg}`);
  const captured = block?.["height"];
  const height = captured && captured !== "none" ? captured : fallbackHeight;
  if (height) {
    out.push(`min-height: ${height}`);
    out.push("display: flex");
    out.push("flex-direction: column");
    out.push(`justify-content: ${VALIGN[block?.["vertical-align"] ?? ""] ?? "center"}`);
  }
  return out.join("; ");
}

/** Inline style for a section's centered *content box*: the max-width the
 * export measured (overriding the component's Tailwind default) and its text
 * alignment. Padding stays with the component so bands keep a consistent
 * vertical rhythm. Returns "" when the block constrains nothing. */
export function contentStyle(block?: Record<string, string>): string {
  const out: string[] = [];
  const mw = block?.["_max-content-width"];
  if (mw && mw !== "none") out.push(`max-width: ${mw}`);
  const ta = block?.["text-align"];
  if (ta) out.push(`text-align: ${ta}`);
  return out.join("; ");
}
