// Shared shapes for the admin tree API and UI (isomorphic — no server imports).

export type EntryType = "file" | "directory";

export interface TreeFile {
  /** Path segments relative to the store root, e.g. ["Concert 2026", "song.mp3"]. */
  path: string[];
  size: number;
  uploadedAt: string;
  url: string;
  downloadUrl: string;
}

export interface TreeResponse {
  files: TreeFile[];
  /** Every folder in the store, each as an array of path segments. */
  folders: string[][];
  /**
   * Manual file order per directory, keyed by path segments joined with "/"
   * (root = ""). Directories without an `.order.json` are simply absent.
   */
  orders: Record<string, string[]>;
}
