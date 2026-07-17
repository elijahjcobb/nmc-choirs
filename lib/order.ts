// Folder ordering contract — the SINGLE choke point for admin-defined ordering.
//
// A parallel effort is adding the ability for the admin to set a manual order per
// folder. Until that storage format lands, `getFolderOrder` returns null and the
// public site falls back to natural sort (directories first). When it lands, only
// `getFolderOrder`'s body needs to read the admin's stored order — the entire
// public app already consumes children in server order and never re-sorts.
import { compareItems } from "./files";
import type { TreeNode } from "./tree-types";

/**
 * Admin-defined child order (array of child names) for a folder, or null when no
 * explicit order exists. Server-only in practice (called from the tree builder).
 */
export async function getFolderOrder(
  _path: string[],
): Promise<string[] | null> {
  // TODO: read the admin ordering manifest once that feature lands.
  return null;
}

function compareNodes(a: TreeNode, b: TreeNode): number {
  return compareItems(
    { type: a.type === "folder" ? "directory" : "file", name: a.name },
    { type: b.type === "folder" ? "directory" : "file", name: b.name },
  );
}

/**
 * Apply an admin order to a folder's children. Names present in `order` come first
 * in that order; anything missing from the list (e.g. uploaded after the order was
 * saved) is appended in natural order. A null/empty order sorts everything naturally.
 */
export function orderChildren(
  order: string[] | null,
  children: TreeNode[],
): TreeNode[] {
  if (!order || order.length === 0) {
    return [...children].sort(compareNodes);
  }
  const rank = new Map<string, number>();
  order.forEach((name, i) => rank.set(name, i));
  const known: TreeNode[] = [];
  const unknown: TreeNode[] = [];
  for (const child of children) {
    (rank.has(child.name) ? known : unknown).push(child);
  }
  known.sort((a, b) => rank.get(a.name)! - rank.get(b.name)!);
  unknown.sort(compareNodes);
  return [...known, ...unknown];
}
