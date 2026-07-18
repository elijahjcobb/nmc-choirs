// Bridge from the library index to the player: build a track's folder queue and
// start playback. Called synchronously inside tap handlers so iOS unlocks the
// audio element (enabling autoplay + lock-screen auto-advance).
import type { TreeAccess } from "@/hooks/use-tree";
import type { TreeFileNode } from "@/lib/tree-types";
import { buildAudioQueue, toTrackRef, type TrackRef } from "@/lib/player/queue";
import { playTrack } from "@/lib/player/player-store";

export function playAudioFile(
  tree: TreeAccess,
  node: TreeFileNode,
  path: string[],
  opts?: { seekTo?: number },
): TrackRef {
  const parent = tree.getNode(path.slice(0, -1));
  const siblings = parent && parent.type === "folder" ? parent.children : [node];
  const queue = buildAudioQueue(siblings, path.slice(0, -1));
  const track = toTrackRef(node, path);
  playTrack(track, { queue, seekTo: opts?.seekTo });
  return track;
}
