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
import {
  compareItems,
  isHiddenName,
  parseOrderJson,
  sortFilesWithOrder,
  BLOB_ROOT,
} from "./files";

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
/** Per-folder admin ordering manifest: a JSON array of file names, in order. */
export const ORDER = ".order.json";
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
  // immediate subfolder name -> whether it has any real (non-hidden) descendant
  const folderHasContent = new Map<string, boolean>();
  // This directory's own `.order.json`, if present in the same list() pass.
  let orderBlob: { url: string; uploadedAt: Date } | null = null;

  for (const blob of blobs) {
    const rel = blob.pathname.slice(prefix.length);
    if (rel.length === 0) continue;
    const slash = rel.indexOf("/");
    if (slash === -1) {
      if (isHiddenName(rel)) {
        // hidden metadata (.keep, .order.json) — never a listed file
        if (rel === ORDER) orderBlob = blob;
        continue;
      }
      files.push({
        type: "file",
        name: rel,
        mtime: blob.uploadedAt.toISOString(),
        size: blob.size,
      });
    } else {
      const folderName = rel.slice(0, slash);
      const isReal = !isHiddenName(rel.slice(rel.lastIndexOf("/") + 1));
      folderHasContent.set(folderName, (folderHasContent.get(folderName) ?? false) || isReal);
    }
  }

  const order = orderBlob ? await fetchOrder(orderBlob) : null;

  const folders: APIItem[] = [];
  for (const [name, hasContent] of folderHasContent) {
    if (hasContent) folders.push({ type: "directory", name, mtime: "" });
  }
  folders.sort(compareItems);

  return [...folders, ...sortFilesWithOrder(files, order)];
}

/**
 * Fetch and parse an `.order.json` blob's content. Cache-busts the CDN with the
 * blob's `uploadedAt` so the 60s `cacheControlMaxAge` never serves a stale body.
 * Null on any failure — the merge rule tolerates a missing/invalid order.
 */
export async function fetchOrder(blob: {
  url: string;
  uploadedAt: Date;
}): Promise<string[] | null> {
  try {
    const res = await fetch(`${blob.url}?v=${blob.uploadedAt.getTime()}`);
    if (!res.ok) return null;
    return parseOrderJson(await res.text());
  } catch {
    return null;
  }
}

export type ResolvedFile = APIFile & { url: string; downloadUrl: string };

/** Resolve a single file blob, or null if it does not exist. */
export async function getFile(path: string[]): Promise<ResolvedFile | null> {
  if (path.length === 0) return null;
  if (isHiddenName(path[path.length - 1])) return null; // never serve .keep/.order.json
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

/** Persist a directory's manual file order to its hidden `.order.json` blob. */
export async function writeOrder(dir: string[], names: string[]): Promise<void> {
  await put(dirPrefix(dir) + ORDER, JSON.stringify(names), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    // 60s is Blob's minimum; reads cache-bust via uploadedAt (see fetchOrder).
    cacheControlMaxAge: 60,
  });
}

/** Read a directory's current order, or null if absent/invalid. */
async function readOrder(dir: string[]): Promise<string[] | null> {
  try {
    const h = await head(dirPrefix(dir) + ORDER); // head metadata is not CDN-cached
    return fetchOrder(h);
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

/**
 * Best-effort: keep a renamed file's slot in its directory's order. Never
 * throws — order is advisory and the merge rule self-heals a stale entry.
 */
export async function renameInOrder(
  dir: string[],
  oldName: string,
  newName: string,
): Promise<void> {
  try {
    const order = await readOrder(dir);
    if (!order) return;
    const idx = order.indexOf(oldName);
    if (idx === -1) return;
    order[idx] = newName;
    await writeOrder(dir, order);
  } catch {
    /* best-effort; ignore */
  }
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
