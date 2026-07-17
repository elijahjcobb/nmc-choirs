// Server-only: build the full public library index from Vercel Blob in one pass.
// One `listSubtree` call (≤1000 blobs per API call, paginated) → a nested,
// pre-ordered tree. Only folders on the path to a visible (public) file are
// created, so empty folders and folders holding only non-public files (mp4/mov,
// stray .keep/.order.json placeholders) never appear.
//
// Ordering: each folder may contain a `.order.json` (array of child names, admin
// order). Those are fetched and applied here; folders without one fall back to
// natural sort. The client is order-blind — it consumes children as delivered.
import { listSubtree, ROOT, KEEP, ORDER_FILE } from "./blob";
import { extensionOf, isPublicFile } from "./files";
import { orderChildren } from "./order";
import { pathKey } from "./paths";
import type {
  LibraryIndex,
  PublicExtension,
  TreeFileNode,
  TreeFolderNode,
  TreeNode,
} from "./tree-types";

interface MutableFolder {
  kind: "folder";
  name: string;
  children: Map<string, MutableNode>;
}
type MutableNode = MutableFolder | (TreeFileNode & { kind: "file" });

export async function buildLibraryIndex(): Promise<LibraryIndex> {
  const blobs = await listSubtree(ROOT);
  const root: MutableFolder = { kind: "folder", name: "", children: new Map() };
  // folder pathKey -> URL of that folder's .order.json (if any)
  const orderUrls = new Map<string, string>();

  for (const blob of blobs) {
    const rel = blob.pathname.slice(ROOT.length);
    if (rel.length === 0) continue;
    const segments = rel.split("/");
    const base = segments[segments.length - 1];

    if (base === ORDER_FILE) {
      orderUrls.set(pathKey(segments.slice(0, -1)), blob.url);
      continue;
    }
    if (base === KEEP || !isPublicFile(base)) continue;

    let cursor = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const existing = cursor.children.get(seg);
      if (existing && existing.kind === "folder") {
        cursor = existing;
      } else {
        const folder: MutableFolder = { kind: "folder", name: seg, children: new Map() };
        cursor.children.set(seg, folder);
        cursor = folder;
      }
    }

    cursor.children.set(base, {
      kind: "file",
      type: "file",
      name: base,
      ext: extensionOf(base) as PublicExtension,
      size: blob.size,
      mtime: blob.uploadedAt.toISOString(),
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
  }

  const orders = await fetchOrders(orderUrls);
  const rootNode = finalizeFolder(root, [], orders);
  return { v: 1, generatedAt: new Date().toISOString(), root: rootNode };
}

async function fetchOrders(
  urls: Map<string, string>,
): Promise<Map<string, string[]>> {
  const orders = new Map<string, string[]>();
  await Promise.all(
    [...urls].map(async ([key, url]) => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const arr = await res.json();
        if (Array.isArray(arr)) {
          orders.set(key, arr.filter((x): x is string => typeof x === "string"));
        }
      } catch {
        /* ignore a malformed/missing order file */
      }
    }),
  );
  return orders;
}

function finalizeFolder(
  folder: MutableFolder,
  path: string[],
  orders: Map<string, string[]>,
): TreeFolderNode {
  const children: TreeNode[] = [];
  for (const child of folder.children.values()) {
    if (child.kind === "folder") {
      children.push(finalizeFolder(child, [...path, child.name], orders));
    } else {
      const { kind: _kind, ...fileNode } = child;
      children.push(fileNode);
    }
  }
  const order = orders.get(pathKey(path)) ?? null;
  return { type: "folder", name: folder.name, children: orderChildren(order, children) };
}
