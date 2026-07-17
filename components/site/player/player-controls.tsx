// The full player UI, driven entirely by the active player state (no file prop),
// so it renders identically on a track's page and inside the Now Playing sheet.
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "../icons";
import { Scrubber } from "./scrubber";
import { usePlayerState, usePlayerTime } from "@/lib/player/use-player";

// Client-only (vaul portal + Web Audio); never server-rendered.
const PitchPipe = dynamic(
  () => import("../pitch-pipe/pitch-pipe").then((m) => m.PitchPipe),
  { ssr: false },
);
import {
  addMarker,
  clearLoop,
  jumpToMarker,
  removeMarker,
  seekBy,
  setLoopEnabled,
  setLoopPoint,
  setSpeed,
  toggle,
} from "@/lib/player/player-store";
import { SPEEDS } from "@/lib/player/persistence";
import { formatDuration } from "@/lib/paths";
import { fileUrl, shareLink } from "@/lib/share";

function speedLabel(s: number): string {
  return `${s % 1 === 0 ? s.toFixed(1) : s}×`;
}

const secondaryBtn =
  "flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand";

export function PlayerControls({ artSize = "min(300px,64vw)" }: { artSize?: string }) {
  const st = usePlayerState();
  const tm = usePlayerTime();
  const [pitchOpen, setPitchOpen] = useState(false);

  if (!st.track) return null;
  const playing = st.status === "playing" || st.status === "buffering";

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(st.speed as (typeof SPEEDS)[number]);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Artwork */}
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px]"
        style={{ background: "var(--art)", width: artSize }}
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
        <img src="/pine-white.png" alt="" className="absolute bottom-3 right-4 h-[26px] w-auto opacity-55" />
        {playing && (
          <div className="absolute bottom-3.5 left-4 flex h-6 items-end gap-1">
            {[0, 0.25, 0.5].map((d) => (
              <span
                key={d}
                className="w-[5px] rounded-[3px] bg-white/90"
                style={{ height: 24, transformOrigin: "bottom", animation: `nmc-eq 0.9s ease-in-out ${d}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scrubber + times */}
      <div className="flex w-full max-w-[460px] flex-col gap-[7px]">
        <Scrubber
          position={tm.position}
          duration={st.duration}
          buffered={tm.buffered}
          loop={st.loop}
          markers={st.markers}
        />
        <div className="flex justify-between text-[11.5px] text-subtle">
          <span>{formatDuration(tm.position)}</span>
          <span>{formatDuration(st.duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div className="flex w-full items-center justify-center gap-[26px]">
        <button type="button" onClick={cycleSpeed} className="min-w-[52px] select-none rounded-full border-[1.5px] border-line-strong px-2.5 py-[7px] text-center text-[13px] font-semibold text-ink transition-colors hover:border-brand">
          {speedLabel(st.speed)}
        </button>
        <button type="button" onClick={() => seekBy(-10)} className="text-ink/80 transition-opacity hover:opacity-70" aria-label="Back 10 seconds">
          <Icon name="replay_10" size={31} />
        </button>
        <button type="button" onClick={toggle} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-brand text-brand-ink shadow-[0_6px_18px_rgba(14,101,55,0.35)] transition-transform hover:scale-[1.04]" aria-label={playing ? "Pause" : "Play"}>
          <Icon name={playing ? "pause" : "play_arrow"} size={37} filled />
        </button>
        <button type="button" onClick={() => seekBy(10)} className="text-ink/80 transition-opacity hover:opacity-70" aria-label="Forward 10 seconds">
          <Icon name="forward_10" size={31} />
        </button>
        <div className="min-w-[52px]" />
      </div>

      {/* Practice tools */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => setLoopPoint("a")} className={secondaryBtn} aria-label="Set loop start">A</button>
        <button type="button" onClick={() => setLoopPoint("b")} className={secondaryBtn} aria-label="Set loop end">B</button>
        <button type="button" onClick={() => addMarker()} className={secondaryBtn}>
          <Icon name="bookmark_add" size={16} />
          Marker
        </button>
        <button type="button" onClick={() => setPitchOpen(true)} className={secondaryBtn}>
          <Icon name="tune" size={16} />
          Pitch
        </button>
        <button
          type="button"
          onClick={() =>
            void shareLink(
              fileUrl(st.track!.path, { t: Math.floor(tm.position) }),
              st.track!.name,
            )
          }
          className={secondaryBtn}
        >
          <Icon name="share" size={16} />
          Share
        </button>
      </div>

      {/* Loop chip */}
      {st.loop && (
        <div className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px] text-subtle">
          <button
            type="button"
            onClick={() => setLoopEnabled(!st.loop!.enabled)}
            className="flex items-center gap-1.5 font-semibold text-ink"
          >
            <Icon name="repeat" size={15} className={st.loop.enabled ? "text-brand" : "text-faint"} />
            Loop {formatDuration(st.loop.a)}–{formatDuration(st.loop.b)}
            {!st.loop.enabled && <span className="text-faint"> (tap to arm)</span>}
          </button>
          <button type="button" onClick={clearLoop} aria-label="Clear loop" className="text-faint hover:text-ink">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {pitchOpen && (
        <PitchPipe open={pitchOpen} onOpenChange={setPitchOpen} folderPath={st.track.folderPath} />
      )}

      {/* Markers */}
      {st.markers.length > 0 && (
        <div className="flex w-full max-w-[460px] flex-col gap-1.5">
          {st.markers.map((m, i) => (
            <div key={`${m.t}-${i}`} className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2">
              <button type="button" onClick={() => jumpToMarker(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="font-mono text-[11.5px] text-subtle">{formatDuration(m.t)}</span>
                <span className="truncate text-[13px] text-ink">{m.label}</span>
              </button>
              <button type="button" onClick={() => removeMarker(i)} aria-label="Remove marker" className="text-faint hover:text-ink">
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
