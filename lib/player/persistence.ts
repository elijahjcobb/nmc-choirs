// Playback persistence: resume positions (per track) and the global speed.
import {
  deleteMapEntry,
  readMapEntry,
  readValue,
  writeMapEntry,
  writeValue,
  type Stamped,
} from "@/lib/storage/storage";

const POS_KEY = "audio.positions";
const SPEED_KEY = "audio.speed";
const POS_CAP = 200;

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface StoredPos extends Stamped {
  t: number;
  d: number;
}

/** Saved resume time, or null when there's nothing worth resuming. */
export function loadPosition(pathKey: string): number | null {
  const entry = readMapEntry<StoredPos>(POS_KEY, pathKey);
  if (!entry || typeof entry.t !== "number") return null;
  if (entry.t < 5) return null; // barely started
  if (entry.d && entry.t > entry.d - 5) return null; // essentially finished
  return entry.t;
}

export function savePosition(pathKey: string, t: number, d: number): void {
  writeMapEntry<StoredPos>(POS_KEY, pathKey, { t, d, at: Date.now() }, POS_CAP);
}

export function clearPosition(pathKey: string): void {
  deleteMapEntry(POS_KEY, pathKey);
}

export function loadSpeed(): number {
  const s = readValue<number>(SPEED_KEY, 1);
  return (SPEEDS as readonly number[]).includes(s) ? s : 1;
}

export function saveSpeed(s: number): void {
  writeValue(SPEED_KEY, s);
}
