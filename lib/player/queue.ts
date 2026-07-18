// Playback queue construction from the library index. A track's queue is the
// audio files of its folder, in server (admin) order.
import type { TreeFileNode, TreeNode } from "@/lib/tree-types";
import { kindOf, pathKey, stripExt } from "@/lib/paths";

export interface TrackRef {
  path: string[];
  pathKey: string;
  /** Display name, extension stripped. */
  name: string;
  url: string;
  downloadUrl?: string;
  folderPath: string[];
  /** Last folder segment, used as the Media Session "artist". */
  folderName: string;
}

export function toTrackRef(node: TreeFileNode, path: string[]): TrackRef {
  const folderPath = path.slice(0, -1);
  return {
    path,
    pathKey: pathKey(path),
    name: stripExt(node.name),
    url: node.url,
    downloadUrl: node.downloadUrl,
    folderPath,
    folderName: folderPath[folderPath.length - 1] ?? "NMC Music",
  };
}

/** Audio siblings of a folder as an ordered queue. */
export function buildAudioQueue(
  siblings: TreeNode[],
  folderPath: string[],
): TrackRef[] {
  return siblings
    .filter((n): n is TreeFileNode => n.type === "file" && kindOf(n.ext) === "audio")
    .map((n) => toTrackRef(n, [...folderPath, n.name]));
}
