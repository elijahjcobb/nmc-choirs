// Server-only: build the full public library index from Vercel Blob in one pass.
// One `listSubtree` call (≤1000 blobs per API call, paginated) → a nested,
// pre-ordered tree. Only folders on the path to a visible (public) file are
// created, so empty folders and folders holding only non-public files (mp4/mov,
// stray .keep placeholders) never appear — matching the old empty-folder hiding.
import { listSubtree, ROOT, KEEP } from "./blob";
import { extensionOf, isPublicFile } from "./files";
import { getFolderOrder, orderChildren } from "./order";
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

  for (const blob of blobs) {
    const rel = blob.pathname.slice(ROOT.length);
    if (rel.length === 0) continue;
    const segments = rel.split("/");
    const base = segments[segments.length - 1];
    if (base === KEEP || !isPublicFile(base)) continue;

    let cursor = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const existing = cursor.children.get(seg);
      if (existing && existing.kind === "folder") {
        cursor = existing;
      } else {
        const folder: MutableFolder = {
          kind: "folder",
          name: seg,
          children: new Map(),
        };
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

  const rootNode = await finalizeFolder(root, []);
  return { v: 1, generatedAt: new Date().toISOString(), root: rootNode };
}

async function finalizeFolder(
  folder: MutableFolder,
  path: string[],
): Promise<TreeFolderNode> {
  const children: TreeNode[] = [];
  for (const child of folder.children.values()) {
    if (child.kind === "folder") {
      children.push(await finalizeFolder(child, [...path, child.name]));
    } else {
      const { kind: _kind, ...fileNode } = child;
      children.push(fileNode);
    }
  }
  const order = await getFolderOrder(path);
  return { type: "folder", name: folder.name, children: orderChildren(order, children) };
}
