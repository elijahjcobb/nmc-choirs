// Isomorphic file helpers — safe to import from both server and client code.
// No @vercel/blob import here (that is server-only, see lib/blob.ts).

/** Root prefix under which all managed files live in the blob store. */
export const BLOB_ROOT = "files/";

export const ALLOWED_EXTENSIONS = [
  "mp3",
  "wav",
  "aac",
  "m4a",
  "mp4",
  "mov",
  "pdf",
  "txt",
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/** `accept` attribute for <input type="file"> — e.g. ".mp3,.wav,..." */
export const ACCEPT = ALLOWED_EXTENSIONS.map((e) => "." + e).join(",");

/** Lowercased extension without the dot, or null if the name has none. */
export function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

export function isAllowedFile(name: string): boolean {
  const ext = extensionOf(name);
  return ext !== null && (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Validate a folder or file name. Returns an error message, or null if valid.
 * Spaces, parentheses, apostrophes and unicode are allowed; slashes, a few
 * URL-hostile characters, control chars, and leading dots are not.
 */
export function validateEntryName(name: string): string | null {
  if (typeof name !== "string" || name.length === 0) return "Name cannot be empty.";
  if (name !== name.trim()) return "Name cannot start or end with a space.";
  if (name === "." || name === "..") return "Invalid name.";
  if (name.startsWith(".")) return "Name cannot start with a dot.";
  if (name.length > 200) return "Name is too long (max 200 characters).";
  if (/[/\\]/.test(name)) return "Name cannot contain slashes.";
  if (/[#?%]/.test(name)) return "Name cannot contain # ? or % characters.";
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) < 32) return "Name contains invalid characters.";
  }
  return null;
}

/** Build a URL path from decoded segments, percent-encoding each segment. */
export function encodePathForRoute(path: string[]): string {
  return "/" + path.map(encodeURIComponent).join("/");
}

export interface SortableItem {
  type: "file" | "directory";
  name: string;
}

/** Natural (numeric, case-insensitive) comparison of two names. */
export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Directories first, then natural (numeric, case-insensitive) name order. */
export function compareItems(a: SortableItem, b: SortableItem): number {
  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
  return compareNames(a.name, b.name);
}

/** Hidden metadata basenames (".keep", ".order.json", any dot-prefixed name). */
export function isHiddenName(name: string): boolean {
  return name.startsWith(".");
}

/**
 * Apply a manual file order. Files whose names appear in `order` keep that
 * relative order (first occurrence wins); order entries with no matching file
 * are ignored; files absent from `order` are appended at the end, sorted
 * alphabetically among themselves. Pass null for "no order file" (pure alpha).
 */
export function sortFilesWithOrder<T extends { name: string }>(
  files: readonly T[],
  order: readonly string[] | null,
): T[] {
  if (!order || order.length === 0) {
    return [...files].sort((a, b) => compareNames(a.name, b.name));
  }
  const rank = new Map<string, number>();
  order.forEach((name, i) => {
    if (!rank.has(name)) rank.set(name, i);
  });
  const ordered: T[] = [];
  const rest: T[] = [];
  for (const file of files) {
    (rank.has(file.name) ? ordered : rest).push(file);
  }
  ordered.sort((a, b) => rank.get(a.name)! - rank.get(b.name)!);
  rest.sort((a, b) => compareNames(a.name, b.name));
  return [...ordered, ...rest];
}

/** Defensive parse of an `.order.json` body. Null on any structural problem. */
export function parseOrderJson(text: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    if (!parsed.every((n): n is string => typeof n === "string")) return null;
    return parsed;
  } catch {
    return null;
  }
}
