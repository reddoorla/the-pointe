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
