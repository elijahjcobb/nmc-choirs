// Pointer-driven seek bar. During a drag the audio element is NOT seeked on every
// move (iOS seeks stutter) — the store's `scrubbing` preview drives the UI and the
// real seek happens on release. `touch-action:none` + pointer capture keep the
// drag from turning into a page scroll in standalone PWAs.
import { useRef } from "react";
import { seekTo, setScrubbing } from "@/lib/player/player-store";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function Scrubber({
  position,
  duration,
  buffered,
}: {
  position: number;
  duration: number;
  buffered: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const frac = duration > 0 ? clamp01(position / duration) : 0;
  const bufFrac = duration > 0 ? clamp01((position + buffered) / duration) : 0;

  const fracFromEvent = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clamp01((clientX - rect.left) / rect.width);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (duration <= 0) return;
    dragging.current = true;
    trackRef.current?.setPointerCapture(e.pointerId);
    setScrubbing(true, fracFromEvent(e.clientX) * duration);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setScrubbing(true, fracFromEvent(e.clientX) * duration);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    seekTo(fracFromEvent(e.clientX) * duration);
    setScrubbing(false);
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative flex h-[18px] cursor-pointer touch-none select-none items-center"
    >
      <div className="relative h-[5px] w-full rounded-full bg-line">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand/25"
          style={{ width: `${bufFrac * 100}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${frac * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
          style={{ left: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}
