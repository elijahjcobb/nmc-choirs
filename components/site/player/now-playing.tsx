// Now Playing sheet — the mini-player expands into the full player controls.
import { Sheet } from "./sheet";
import { PlayerControls } from "./player-controls";
import { usePlayerState } from "@/lib/player/use-player";

export function NowPlaying({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const st = usePlayerState();
  if (!st.track) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Now playing">
      <div className="mb-5 text-center">
        <div className="text-lg font-bold text-ink text-pretty">{st.track.name}</div>
        <div className="text-[13px] text-subtle">{st.track.folderName}</div>
      </div>
      <PlayerControls artSize="min(260px,70vw)" />
    </Sheet>
  );
}
