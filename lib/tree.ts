// Server-only: build the full public library index from Vercel Blob in one pass.
// One `listSubtree` call (≤1000 blobs per API call, paginated) → a nested,
// pre-ordered tree. Only folders on the path to a visible (public) file are
// created, so empty folders and folders holding only non-public files (mp4/mov,
// stray .keep/.order.json placeholders) never appear.
//
// Ordering: each folder may hold a `.order.json` (admin file order). Folders are
// always alphabetical; files honour the order file (see sortFilesWithOrder),
// matching the admin's own listDir. The client consumes children as delivered.
import { listSubtree, ROOT, KEEP, ORDER, fetchOrder } from "./blob";
import { compareNames, extensionOf, isPublicFile, sortFilesWithOrder } from "./files";
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

interface OrderBlobRef {
  url: string;
  uploadedAt: Date;
}

export async function buildLibraryIndex(): Promise<LibraryIndex> {
  const blobs = await listSubtree(ROOT);
  const root: MutableFolder = { kind: "folder", name: "", children: new Map() };
  // folder pathKey -> its .order.json blob (for cache-busted fetch)
  const orderBlobs = new Map<string, OrderBlobRef>();

  for (const blob of blobs) {
    const rel = blob.pathname.slice(ROOT.length);
    if (rel.length === 0) continue;
    const segments = rel.split("/");
    const base = segments[segments.length - 1];

    if (base === ORDER) {
      orderBlobs.set(pathKey(segments.slice(0, -1)), blob);
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

  const orders = new Map<string, string[]>();
  await Promise.all(
    [...orderBlobs].map(async ([key, blob]) => {
      const order = await fetchOrder(blob);
      if (order) orders.set(key, order);
    }),
  );

  const rootNode = finalizeFolder(root, [], orders);
  return { v: 1, generatedAt: new Date().toISOString(), root: rootNode };
}

function finalizeFolder(
  folder: MutableFolder,
  path: string[],
  orders: Map<string, string[]>,
): TreeFolderNode {
  const folders: TreeFolderNode[] = [];
  const files: TreeFileNode[] = [];
  for (const child of folder.children.values()) {
    if (child.kind === "folder") {
      folders.push(finalizeFolder(child, [...path, child.name], orders));
    } else {
      const { kind: _kind, ...fileNode } = child;
      files.push(fileNode);
    }
  }
  folders.sort((a, b) => compareNames(a.name, b.name));
  const orderedFiles = sortFilesWithOrder(files, orders.get(pathKey(path)) ?? null);
  const children: TreeNode[] = [...folders, ...orderedFiles];
  return { type: "folder", name: folder.name, children };
}
