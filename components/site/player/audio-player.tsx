// Full audio player shown on an audio file's page (and reused in the Now Playing
// sheet). Reads the persistent player store; if this file isn't the active track
// yet, the play button starts it (and it autoplays on open where allowed).
import { useEffect } from "react";
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { Scrubber } from "./scrubber";
import { playAudioFile } from "./play-file";
import { usePlayerState, usePlayerTime } from "@/lib/player/use-player";
import { seekBy, setSpeed, toggle } from "@/lib/player/player-store";
import { SPEEDS } from "@/lib/player/persistence";
import { formatDuration, pathKey } from "@/lib/paths";
import type { TreeFileNode } from "@/lib/tree-types";

function speedLabel(s: number): string {
  return `${s % 1 === 0 ? s.toFixed(1) : s}×`;
}

export function AudioPlayer({ file, path }: { file: TreeFileNode; path: string[] }) {
  const { tree } = useSite();
  const st = usePlayerState();
  const tm = usePlayerTime();

  const thisKey = pathKey(path);
  const active = st.track?.pathKey === thisKey;
  const playing = active && (st.status === "playing" || st.status === "buffering");

  // Autoplay on open (best effort — blocked cold loads fall back to the button).
  useEffect(() => {
    if (st.track?.pathKey !== thisKey) playAudioFile(tree, file, path);
    // Only when the target file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisKey]);

  const duration = active ? st.duration : 0;
  const position = active ? tm.position : 0;
  const buffered = active ? tm.buffered : 0;

  const onPlayPause = () => {
    if (active) toggle();
    else playAudioFile(tree, file, path);
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(st.speed as (typeof SPEEDS)[number]);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  return (
    <div className="flex flex-col items-center gap-5 rounded-[22px] border border-line bg-surface p-[clamp(18px,3vw,28px)]">
      {/* Artwork */}
      <div
        className="relative flex aspect-square w-[min(300px,64vw)] items-center justify-center overflow-hidden rounded-[22px]"
        style={{ background: "var(--art)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 21px, rgba(255,255,255,0.09) 21px, rgba(255,255,255,0.09) 22px)",
          }}
        />
        <span style={{ color: "rgba(255,255,255,0.92)" }} className="relative">
          <Icon name="music_note" size={96} filled />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pine-white.png"
          alt=""
          className="absolute bottom-3 right-4 h-[26px] w-auto opacity-55"
        />
        {playing && (
          <div className="absolute bottom-3.5 left-4 flex h-6 items-end gap-1">
            {[0, 0.25, 0.5].map((d) => (
              <span
                key={d}
                className="w-[5px] rounded-[3px] bg-white/90"
                style={{
                  height: 24,
                  transformOrigin: "bottom",
                  animation: `nmc-eq 0.9s ease-in-out ${d}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scrubber + times */}
      <div className="flex w-full max-w-[460px] flex-col gap-[7px]">
        <Scrubber position={position} duration={duration} buffered={buffered} />
        <div className="flex justify-between text-[11.5px] text-subtle">
          <span>{formatDuration(position)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div className="flex w-full items-center justify-center gap-[26px]">
        <button
          type="button"
          onClick={cycleSpeed}
          className="min-w-[52px] select-none rounded-full border-[1.5px] border-line-strong px-2.5 py-[7px] text-center text-[13px] font-semibold text-ink transition-colors hover:border-brand"
        >
          {speedLabel(st.speed)}
        </button>
        <button
          type="button"
          onClick={() => seekBy(-10)}
          className="text-ink/80 transition-opacity hover:opacity-70"
          aria-label="Back 10 seconds"
        >
          <Icon name="replay_10" size={31} />
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-brand text-brand-ink shadow-[0_6px_18px_rgba(14,101,55,0.35)] transition-transform hover:scale-[1.04]"
          aria-label={playing ? "Pause" : "Play"}
        >
          <Icon name={playing ? "pause" : "play_arrow"} size={37} filled />
        </button>
        <button
          type="button"
          onClick={() => seekBy(10)}
          className="text-ink/80 transition-opacity hover:opacity-70"
          aria-label="Forward 10 seconds"
        >
          <Icon name="forward_10" size={31} />
        </button>
        <div className="min-w-[52px]" />
      </div>
    </div>
  );
}
