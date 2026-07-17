// Docked mini-player: keeps playback controllable while browsing. Hidden when
// nothing is loaded or when the visitor is already on the active track's page.
// The progress hairline updates via a ref (no per-frame React render).
import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { NowPlaying } from "./now-playing";
import { usePlayerState } from "@/lib/player/use-player";
import {
  getState,
  getTime,
  subscribeState,
  subscribeTime,
  toggle,
} from "@/lib/player/player-store";
import { useCurrentPath } from "@/hooks/use-shallow-nav";
import { pathKey } from "@/lib/paths";

function ProgressHairline() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const s = getState();
      const t = getTime();
      const frac = s.duration > 0 ? Math.min(1, t.position / s.duration) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${frac})`;
    };
    update();
    const un1 = subscribeTime(update);
    const un2 = subscribeState(update);
    return () => {
      un1();
      un2();
    };
  }, []);
  return (
    <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-line">
      <div ref={ref} className="h-full origin-left bg-brand" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

export function MiniPlayer() {
  const st = usePlayerState();
  const currentPath = useCurrentPath();
  const [npOpen, setNpOpen] = useState(false);

  if (!st.track || st.status === "idle") return null;
  if (pathKey(currentPath) === st.track.pathKey) return null; // on the track's own page

  const playing = st.status === "playing" || st.status === "buffering";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NowPlaying open={npOpen} onOpenChange={setNpOpen} />
      <div className="relative mx-auto flex max-w-[1080px] items-center gap-3 px-4 py-2.5">
        <ProgressHairline />
        <button
          type="button"
          onClick={() => setNpOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-tile-audio-bg text-tile-audio-fg">
            <Icon name="music_note" size={20} filled />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {st.track.name}
            </span>
            <span className="block truncate text-[11.5px] text-subtle">
              {st.track.folderName}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform hover:scale-105"
          aria-label={playing ? "Pause" : "Play"}
        >
          <Icon name={playing ? "pause" : "play_arrow"} size={24} filled />
        </button>
      </div>
    </div>
  );
}
