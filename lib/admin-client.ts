// Client-side helpers for the admin explorer.
import type { TreeResponse, TreeFile, EntryType } from "./admin-types";
import { compareItems, sortFilesWithOrder, extensionOf } from "./files";

export const DRAG_TYPE = "application/x-nmc-entry";

export interface DragPayload {
  path: string[];
  type: EntryType;
}

export interface Row {
  type: EntryType;
  name: string;
  path: string[];
  file?: TreeFile;
}

/** Unique key for a path. Names never contain "/", so join is unambiguous. */
export function pathKey(path: string[]): string {
  return path.join("/");
}

export function parentOf(path: string[]): string[] {
  return path.slice(0, -1);
}

function isChildOf(path: string[], parent: string[]): boolean {
  return (
    path.length === parent.length + 1 &&
    parent.every((seg, i) => path[i] === seg)
  );
}

/**
 * Immediate folder + file rows of a directory: folders first (alphabetical),
 * then files in the directory's saved manual order (see sortFilesWithOrder).
 */
export function directoryContents(tree: TreeResponse, cwd: string[]): Row[] {
  const folderRows: Row[] = [];
  for (const folder of tree.folders) {
    if (isChildOf(folder, cwd)) {
      folderRows.push({ type: "directory", name: folder[folder.length - 1], path: folder });
    }
  }
  folderRows.sort(compareItems);

  const fileRows: Row[] = [];
  for (const file of tree.files) {
    if (isChildOf(file.path, cwd)) {
      fileRows.push({
        type: "file",
        name: file.path[file.path.length - 1],
        path: file.path,
        file,
      });
    }
  }

  return [...folderRows, ...sortFilesWithOrder(fileRows, tree.orders[pathKey(cwd)] ?? null)];
}

/** Direct child folders of a directory, sorted by name. */
export function childFolders(tree: TreeResponse, parent: string[]): string[][] {
  return tree.folders
    .filter((f) => isChildOf(f, parent))
    .sort((a, b) => a[a.length - 1].localeCompare(b[b.length - 1], undefined, { numeric: true, sensitivity: "base" }));
}

/** True if `to` is `from` itself or lives inside it. */
export function isSelfOrDescendant(from: string[], to: string[]): boolean {
  return to.length >= from.length && from.every((seg, i) => to[i] === seg);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type IconKind = "audio" | "video" | "pdf" | "text" | "file";

export function iconKindForName(name: string): IconKind {
  switch (extensionOf(name)) {
    case "mp3":
    case "wav":
    case "aac":
    case "m4a":
      return "audio";
    case "mp4":
    case "mov":
      return "video";
    case "pdf":
      return "pdf";
    case "txt":
      return "text";
    default:
      return "file";
  }
}
