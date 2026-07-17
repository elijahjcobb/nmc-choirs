// Server-only Vercel Blob helpers. The blob store is the single source of
// truth: files live at their real pathnames under `files/`. Blob has no real
// directories, so an empty folder is represented by a hidden `.keep` blob.
// The admin sees every folder (including empty ones); the public listing hides
// folders that contain no real files.
import {
  list,
  put,
  del,
  head,
  copy,
  rename,
  BlobNotFoundError,
  type ListBlobResultBlob,
} from "@vercel/blob";
import { compareItems, BLOB_ROOT } from "./files";

// Listing shapes for the admin/data layer. (The public site uses the richer
// nested LibraryIndex from lib/tree-types.ts instead.)
export interface APIFile {
  name: string;
  mtime: string;
  type: "file";
  size: number;
}

export interface APIDirectory {
  name: string;
  mtime: string;
  type: "directory";
}

export type APIItem = APIFile | APIDirectory;

export const ROOT = BLOB_ROOT;
export const KEEP = ".keep";
/** Per-folder admin ordering manifest: a JSON array of child names, in order. */
export const ORDER_FILE = ".order.json";
// Blob rejects empty bodies ("body is required"), so the placeholder is 1 byte.
const KEEP_BODY = "\n";
const CACHE_MAX_AGE = 3600;
const DEL_BATCH = 100;

/** Prefix for a directory's contents. Always ends in "/". */
export function dirPrefix(path: string[]): string {
  return path.length === 0 ? ROOT : ROOT + path.join("/") + "/";
}

/** Exact pathname of a file blob. */
function filePathname(path: string[]): string {
  return ROOT + path.join("/");
}

/**
 * Immediate children (files + folders) of a directory, for the PUBLIC site.
 * Folders that contain no real files anywhere in their subtree (i.e. only a
 * `.keep` placeholder) are hidden — visitors never see empty folders.
 */
export async function listDir(path: string[]): Promise<APIItem[]> {
  const prefix = dirPrefix(path);
  const blobs = await listSubtree(prefix);
  const files: APIFile[] = [];
  // immediate subfolder name -> whether it has any real (non-.keep) descendant
  const folderHasContent = new Map<string, boolean>();

  for (const blob of blobs) {
    const rel = blob.pathname.slice(prefix.length);
    if (rel.length === 0) continue;
    const slash = rel.indexOf("/");
    if (slash === -1) {
      if (rel === KEEP) continue; // this directory's own placeholder
      files.push({
        type: "file",
        name: rel,
        mtime: blob.uploadedAt.toISOString(),
        size: blob.size,
      });
    } else {
      const folderName = rel.slice(0, slash);
      const isReal = rel.slice(rel.lastIndexOf("/") + 1) !== KEEP;
      folderHasContent.set(folderName, (folderHasContent.get(folderName) ?? false) || isReal);
    }
  }

  const items: APIItem[] = [...files];
  for (const [name, hasContent] of folderHasContent) {
    if (hasContent) items.push({ type: "directory", name, mtime: "" });
  }
  items.sort(compareItems);
  return items;
}

export type ResolvedFile = APIFile & { url: string; downloadUrl: string };

/** Resolve a single file blob, or null if it does not exist. */
export async function getFile(path: string[]): Promise<ResolvedFile | null> {
  if (path.length === 0) return null;
  try {
    const h = await head(filePathname(path));
    return {
      type: "file",
      name: path[path.length - 1],
      mtime: h.uploadedAt.toISOString(),
      size: h.size,
      url: h.url,
      downloadUrl: h.downloadUrl,
    };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

/** Every blob under a prefix (includes `.keep`), paginated. */
export async function listSubtree(prefix: string): Promise<ListBlobResultBlob[]> {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return blobs;
}

/** True if any blob exists at this file pathname. */
export async function fileExists(path: string[]): Promise<boolean> {
  try {
    await head(filePathname(path));
    return true;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return false;
    throw e;
  }
}

/** True if any blob lives under this directory prefix. */
export async function dirExists(path: string[]): Promise<boolean> {
  const res = await list({ prefix: dirPrefix(path), limit: 1 });
  return res.blobs.length > 0;
}

/** Create an (empty) directory via its hidden `.keep` placeholder. */
export async function mkdir(path: string[]): Promise<void> {
  await put(dirPrefix(path) + KEEP, KEEP_BODY, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/**
 * Move/rename a file or directory. Returns the number of blobs moved.
 * Directory moves copy every blob to the new prefix first, then delete the
 * originals — a mid-flight failure leaves harmless duplicates, never data loss.
 */
export async function moveEntry(
  from: string[],
  to: string[],
  type: "file" | "directory",
): Promise<number> {
  if (type === "file") {
    await rename(filePathname(from), filePathname(to), {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: CACHE_MAX_AGE,
    });
    return 1;
  }
  const fromPrefix = dirPrefix(from);
  const toPrefix = dirPrefix(to);
  const blobs = await listSubtree(fromPrefix);
  for (const blob of blobs) {
    await copy(blob.url, toPrefix + blob.pathname.slice(fromPrefix.length), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: CACHE_MAX_AGE,
    });
  }
  await delUrls(blobs.map((b) => b.url));
  return blobs.length;
}

/** Delete a file or an entire directory. Returns the number of blobs removed. */
export async function deleteEntry(
  path: string[],
  type: "file" | "directory",
): Promise<number> {
  if (type === "file") {
    await del(filePathname(path));
    return 1;
  }
  const blobs = await listSubtree(dirPrefix(path));
  await delUrls(blobs.map((b) => b.url));
  return blobs.length;
}

async function delUrls(urls: string[]): Promise<void> {
  for (let i = 0; i < urls.length; i += DEL_BATCH) {
    await del(urls.slice(i, i + DEL_BATCH));
  }
}
