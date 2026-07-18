// Public library index shapes — isomorphic (safe to import from server or client).
// The whole tree is small (<300 files) and is loaded client-side in one shot, so
// the app can navigate, search, and build playback queues with zero round-trips.
import type { PublicExtension } from "./files";

export type { PublicExtension };

/** How a supported file is previewed. */
export type FileKind = "audio" | "pdf" | "text" | "markdown";

export interface TreeFileNode {
  type: "file";
  /** Full name including extension, e.g. "Gloria — Alto.mp3". */
  name: string;
  ext: PublicExtension;
  size: number;
  /** ISO upload time. */
  mtime: string;
  url: string;
  downloadUrl: string;
}

export interface TreeFolderNode {
  type: "folder";
  name: string;
  /** Pre-ordered by the server (admin order, falling back to natural sort). */
  children: TreeNode[];
}

export type TreeNode = TreeFileNode | TreeFolderNode;

export interface LibraryIndex {
  v: 1;
  generatedAt: string;
  /** Synthetic root folder; its `name` is "". */
  root: TreeFolderNode;
}
