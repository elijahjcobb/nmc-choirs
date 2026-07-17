// Chromatic pitch pipe in a bottom sheet. Press-and-hold a key to sound a pitch;
// playback pauses while the sheet is open (iOS ignores element volume, so we
// can't duck). Remembers the last pitch per folder.
import { useEffect, useRef } from "react";
import { Sheet } from "../player/sheet";
import { resumeCtx, startNote, stopNote } from "@/lib/pitch/pitch-pipe";
import { getState, pause, play } from "@/lib/player/player-store";
import { readValue, writeValue } from "@/lib/storage/storage";
import { pathKey } from "@/lib/paths";

const KEY = "pitch.last";
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const OCTAVES = [3, 4, 5];

interface PitchStore {
  global: number;
  byFolder: Record<string, number>;
}

function loadPitch(): PitchStore {
  return readValue<PitchStore>(KEY, { global: 60, byFolder: {} });
}

export function PitchPipe({
  open,
  onOpenChange,
  folderPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string[];
}) {
  const wasPlaying = useRef(false);
  const held = useRef<number | null>(null);
  const folderKey = pathKey(folderPath);

  // Pause playback while the pipe is open; resume after.
  useEffect(() => {
    if (open) {
      const s = getState();
      wasPlaying.current = s.status === "playing" || s.status === "buffering";
      if (wasPlaying.current) pause();
      resumeCtx();
    } else {
      stopNote();
      if (wasPlaying.current) play();
      wasPlaying.current = false;
    }
  }, [open]);

  const pitch = loadPitch();
  const savedOctave = Math.floor(((pitch.byFolder[folderKey] ?? pitch.global) - 12) / 12);
  const octave = OCTAVES.includes(savedOctave) ? savedOctave : 4;

  const remember = (midi: number) => {
    const cur = loadPitch();
    writeValue<PitchStore>(KEY, {
      global: midi,
      byFolder: { ...cur.byFolder, [folderKey]: midi },
    });
  };

  const down = (midi: number) => {
    resumeCtx();
    held.current = midi;
    startNote(midi);
    remember(midi);
  };
  const up = () => {
    held.current = null;
    stopNote();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Pitch pipe">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="text-base font-semibold text-ink">Pitch pipe</div>
          <div className="mt-0.5 text-[13px] text-subtle">Press and hold a note</div>
        </div>
        {OCTAVES.map((oct) => (
          <div key={oct} className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold tracking-[0.1em] text-faint">
              OCTAVE {oct}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {NOTE_NAMES.map((name, i) => {
                const midi = 12 * (oct + 1) + i;
                const sharp = name.includes("♯");
                return (
                  <button
                    key={name}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      down(midi);
                    }}
                    onPointerUp={up}
                    onPointerCancel={up}
                    onPointerLeave={() => held.current === midi && up()}
                    className={`select-none rounded-xl border py-3 text-[13px] font-semibold transition-colors ${
                      sharp
                        ? "border-line bg-nav-hover text-subtle"
                        : "border-line-strong bg-surface text-ink"
                    } active:border-brand active:bg-brand active:text-brand-ink`}
                    style={{ touchAction: "none" }}
                  >
                    {name}
                    <span className="ml-0.5 text-[10px] text-faint">{oct}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-center text-[12px] text-subtle">
          Suggested starting octave: {octave}
        </p>
      </div>
    </Sheet>
  );
}
