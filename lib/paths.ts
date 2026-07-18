// Path, naming, and formatting helpers for the public site — isomorphic.
import type { FileKind, PublicExtension, TreeFileNode, TreeNode } from "./tree-types";

/** Unique key for a decoded path. Names never contain "/", so join is unambiguous. */
export function pathKey(path: string[]): string {
  return path.join("/");
}

export function parentOf(path: string[]): string[] {
  return path.slice(0, -1);
}

/** Strip a single trailing extension from a raw filename. */
export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

/** Human-facing label for a node (folders keep their name, files lose the extension). */
export function displayName(node: TreeNode): string {
  return node.type === "folder" ? node.name : stripExt(node.name);
}

export function kindOf(ext: PublicExtension): FileKind {
  switch (ext) {
    case "mp3":
    case "wav":
    case "aac":
    case "m4a":
      return "audio";
    case "pdf":
      return "pdf";
    case "md":
      return "markdown";
    case "txt":
      return "text";
  }
}

export function isAudioFile(node: TreeNode): node is TreeFileNode {
  return node.type === "file" && kindOf(node.ext) === "audio";
}

/** Build an in-app href from decoded segments (each segment percent-encoded). */
export function hrefForPath(path: string[]): string {
  return "/" + path.map(encodeURIComponent).join("/");
}

/** Decode a Next router catch-all param into plain segments. */
export function decodeSegments(param: string[] | string | undefined): string[] {
  if (!param) return [];
  const arr = Array.isArray(param) ? param : [param];
  return arr.map((s) => decodeURIComponent(s));
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

/** m:ss (or h:mm:ss) from seconds. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

/** Short "Jul 2" style date; appends the year only when it isn't the current one. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
