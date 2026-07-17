// Applies admin-defined folder ordering. The order itself comes from each
// folder's `.order.json` manifest (an array of child names), read by the tree
// builder; this module only turns that array into a stable child sort. The
// client is order-blind — it never re-sorts what the server delivers.
import { compareItems } from "./files";
import type { TreeNode } from "./tree-types";

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
