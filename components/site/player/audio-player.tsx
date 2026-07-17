// Audio file page: autoplays this track on open (falling back to the play button
// where blocked), then shows the shared PlayerControls in the design's card.
import { useEffect } from "react";
import { useSite } from "../site-context";
import { PlayerControls } from "./player-controls";
import { playAudioFile } from "./play-file";
import { usePlayerState } from "@/lib/player/use-player";
import { pathKey } from "@/lib/paths";
import type { TreeFileNode } from "@/lib/tree-types";

export function AudioPlayer({ file, path }: { file: TreeFileNode; path: string[] }) {
  const { tree } = useSite();
  const st = usePlayerState();
  const thisKey = pathKey(path);

  useEffect(() => {
    if (st.track?.pathKey !== thisKey) playAudioFile(tree, file, path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisKey]);

  return (
    <div className="rounded-[22px] border border-line bg-surface p-[clamp(18px,3vw,28px)]">
      <PlayerControls />
    </div>
  );
}
