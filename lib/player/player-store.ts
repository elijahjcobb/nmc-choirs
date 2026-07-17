// The audio engine + player state, owned OUTSIDE React at module scope so a
// single HTMLAudioElement survives every navigation. Two subscription channels
// keep frequent time ticks from re-rendering infrequent UI:
//   • state channel — track, status, duration, speed, queue, loop (rare changes)
//   • time  channel — position, buffered, scrubbing (up to 60Hz while playing)
import {
  setMetadata,
  setPlaybackState,
  setPositionState,
  setupMediaSession,
} from "./media-session";
import {
  clearLoopStored,
  clearPosition,
  loadLoop,
  loadMarkers,
  loadPosition,
  loadSpeed,
  savePosition,
  saveLoop,
  saveMarkers,
  saveSpeed,
  type Marker,
} from "./persistence";
import type { TrackRef } from "./queue";

export type { Marker };

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "blocked"
  | "error";

export interface LoopRegion {
  a: number;
  b: number;
  enabled: boolean;
}

export interface PlayerState {
  track: TrackRef | null;
  status: PlayerStatus;
  duration: number;
  speed: number;
  queue: TrackRef[];
  queueIndex: number;
  loop: LoopRegion | null;
  markers: Marker[];
  errorMessage: string | null;
}

export interface TimeState {
  position: number;
  buffered: number;
  scrubbing: boolean;
}

export const INITIAL_STATE: PlayerState = {
  track: null,
  status: "idle",
  duration: 0,
  speed: 1,
  queue: [],
  queueIndex: -1,
  loop: null,
  markers: [],
  errorMessage: null,
};

export const INITIAL_TIME: TimeState = {
  position: 0,
  buffered: 0,
  scrubbing: false,
};

let state: PlayerState = INITIAL_STATE;
let time: TimeState = INITIAL_TIME;
const stateListeners = new Set<() => void>();
const timeListeners = new Set<() => void>();

function setState(patch: Partial<PlayerState>): void {
  state = { ...state, ...patch };
  stateListeners.forEach((l) => l());
}
function setTime(patch: Partial<TimeState>): void {
  time = { ...time, ...patch };
  timeListeners.forEach((l) => l());
}

export const getState = (): PlayerState => state;
export const getTime = (): TimeState => time;
export function subscribeState(l: () => void): () => void {
  stateListeners.add(l);
  return () => stateListeners.delete(l);
}
export function subscribeTime(l: () => void): () => void {
  timeListeners.add(l);
  return () => timeListeners.delete(l);
}

// ---- the singleton element -------------------------------------------------

let el: HTMLAudioElement | null = null;
let pendingSeek: number | null = null;
let intendToPlay = false;
let lastSaveAt = 0;
let mediaReady = false;

function audio(): HTMLAudioElement {
  if (el) return el;
  el = new Audio();
  el.preload = "metadata";
  const anyEl = el as HTMLAudioElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean };
  anyEl.preservesPitch = true;
  anyEl.webkitPreservesPitch = true;
  state = { ...state, speed: loadSpeed() };
  el.playbackRate = state.speed;
  wireEvents(el);
  ensureMediaSession();
  return el;
}

function ensureMediaSession(): void {
  if (mediaReady) return;
  mediaReady = true;
  setupMediaSession({
    play: () => play(),
    pause: () => pause(),
    next: () => next(),
    previous: () => previous(),
    seekTo: (t) => seekTo(t),
    seekBy: (d) => seekBy(d),
  });
}

function bufferedAhead(a: HTMLAudioElement): number {
  try {
    for (let i = 0; i < a.buffered.length; i++) {
      if (a.currentTime >= a.buffered.start(i) && a.currentTime <= a.buffered.end(i)) {
        return a.buffered.end(i) - a.currentTime;
      }
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function wireEvents(a: HTMLAudioElement): void {
  a.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(a.duration) ? a.duration : 0;
    if (pendingSeek != null && duration > 0) {
      a.currentTime = Math.min(pendingSeek, Math.max(0, duration - 1));
      pendingSeek = null;
    }
    setState({ duration });
    setTime({ position: a.currentTime });
    syncPositionState();
  });
  a.addEventListener("playing", () => {
    setState({ status: "playing" });
    setPlaybackState("playing");
    startTicker();
    syncPositionState();
  });
  a.addEventListener("pause", () => {
    if (a.ended) return;
    stopTicker();
    flushPosition();
    setState({ status: "paused" });
    setPlaybackState("paused");
  });
  a.addEventListener("waiting", () => {
    if (intendToPlay) setState({ status: "buffering" });
  });
  a.addEventListener("timeupdate", () => {
    if (!time.scrubbing) setTime({ position: a.currentTime, buffered: bufferedAhead(a) });
    maybeSave();
  });
  a.addEventListener("ratechange", () => syncPositionState());
  a.addEventListener("seeked", () => {
    setTime({ position: a.currentTime });
    syncPositionState();
  });
  a.addEventListener("ended", () => {
    stopTicker();
    if (state.track) clearPosition(state.track.pathKey);
    advance();
  });
  a.addEventListener("error", () => {
    if (!state.track) return;
    if (intendToPlay && state.queueIndex >= 0 && state.queueIndex < state.queue.length - 1) {
      advance();
      return;
    }
    setState({ status: "error", errorMessage: "Couldn't play this file." });
  });
}

// ---- rAF ticker (smooth scrubber + loop enforcement) -----------------------

let raf = 0;
function startTicker(): void {
  if (raf || typeof requestAnimationFrame === "undefined") return;
  const loop = () => {
    const a = el;
    if (!a) {
      raf = 0;
      return;
    }
    if (state.loop?.enabled && a.currentTime >= state.loop.b) {
      a.currentTime = state.loop.a;
    }
    if (!time.scrubbing) setTime({ position: a.currentTime, buffered: bufferedAhead(a) });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}
function stopTicker(): void {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

// ---- persistence throttle --------------------------------------------------

function maybeSave(): void {
  const now = Date.now();
  if (now - lastSaveAt < 5000) return;
  flushPosition();
}
function flushPosition(): void {
  const a = el;
  if (!a || a.ended || !state.track || state.duration <= 0) return;
  lastSaveAt = Date.now();
  savePosition(state.track.pathKey, a.currentTime, state.duration);
}

function syncPositionState(): void {
  const a = el;
  if (!a) return;
  setPositionState(state.duration, a.currentTime, a.playbackRate);
}

// ---- actions ---------------------------------------------------------------

export interface PlayOptions {
  queue?: TrackRef[];
  seekTo?: number;
}

export function playTrack(track: TrackRef, opts: PlayOptions = {}): void {
  const a = audio();
  flushPosition();

  const queue = opts.queue && opts.queue.length ? opts.queue : [track];
  const queueIndex = queue.findIndex((t) => t.pathKey === track.pathKey);
  const seek = opts.seekTo ?? loadPosition(track.pathKey) ?? 0;
  intendToPlay = true;

  // Restore a saved loop DISARMED (a one-tap re-arm chip), plus saved markers.
  const savedLoop = loadLoop(track.pathKey);
  setState({
    track,
    queue,
    queueIndex: queueIndex >= 0 ? queueIndex : 0,
    status: "loading",
    duration: 0,
    loop: savedLoop ? { ...savedLoop, enabled: false } : null,
    markers: loadMarkers(track.pathKey),
    errorMessage: null,
  });
  setTime({ position: seek, buffered: 0, scrubbing: false });

  // Re-opening the already-loaded track (e.g. tapping it again after it ended)
  // must NOT re-assign the same src — that skips the reload and leaves the
  // playhead at the end, so play() fires `ended` immediately. Seek instead.
  const sameSource = a.currentSrc === track.url || a.src === track.url;
  if (sameSource) {
    pendingSeek = null;
    if (a.readyState >= 1 && Number.isFinite(a.duration)) {
      a.currentTime = Math.min(seek, Math.max(0, a.duration - 0.05));
      setState({ duration: a.duration });
    } else {
      pendingSeek = seek > 0 ? seek : null;
    }
  } else {
    pendingSeek = seek > 0 ? seek : null;
    a.src = track.url;
    a.load();
  }
  a.playbackRate = state.speed;

  setMetadata(track.name, track.folderName);
  setPlaybackState("playing");

  a.play().catch(() => {
    intendToPlay = false;
    setState({ status: "blocked" });
    setPlaybackState("paused");
  });
}

export function play(): void {
  const a = el;
  if (!a || !state.track) return;
  intendToPlay = true;
  a.play().catch(() => {
    intendToPlay = false;
    setState({ status: "blocked" });
  });
}

export function pause(): void {
  const a = el;
  if (!a) return;
  intendToPlay = false;
  a.pause();
}

export function toggle(): void {
  if (state.status === "playing" || state.status === "buffering") pause();
  else play();
}

export function seekTo(t: number): void {
  const a = el;
  if (!a || state.duration <= 0) return;
  const clamped = Math.min(Math.max(0, t), state.duration);
  a.currentTime = clamped;
  setTime({ position: clamped });
}

export function seekBy(delta: number): void {
  const a = el;
  if (!a) return;
  seekTo(a.currentTime + delta);
}

export function setSpeed(speed: number): void {
  const a = el;
  saveSpeed(speed);
  setState({ speed });
  if (a) a.playbackRate = speed;
}

export function setScrubbing(scrubbing: boolean, previewPosition?: number): void {
  if (typeof previewPosition === "number") setTime({ scrubbing, position: previewPosition });
  else setTime({ scrubbing });
}

export function next(): void {
  if (state.queueIndex >= 0 && state.queueIndex < state.queue.length - 1) {
    playTrack(state.queue[state.queueIndex + 1], { queue: state.queue });
  }
}

export function previous(): void {
  const a = el;
  if (a && a.currentTime > 3) {
    seekTo(0);
    return;
  }
  if (state.queueIndex > 0) {
    playTrack(state.queue[state.queueIndex - 1], { queue: state.queue });
  } else {
    seekTo(0);
  }
}

function advance(): void {
  if (state.queueIndex >= 0 && state.queueIndex < state.queue.length - 1) {
    playTrack(state.queue[state.queueIndex + 1], { queue: state.queue });
  } else {
    intendToPlay = false;
    setState({ status: "paused" });
    setTime({ position: state.duration });
    setPlaybackState("paused");
  }
}

// ---- A/B loop (UI wired in a later step) -----------------------------------

export function setLoopPoint(which: "a" | "b"): void {
  const a = el;
  if (!a || !state.track) return;
  const t = a.currentTime;
  const cur = state.loop ?? { a: 0, b: state.duration, enabled: false };
  const nextLoop: LoopRegion = which === "a" ? { ...cur, a: t } : { ...cur, b: t };
  if (nextLoop.b - nextLoop.a < 1) return; // enforce a minimum span
  saveLoop(state.track.pathKey, nextLoop.a, nextLoop.b);
  setState({ loop: { ...nextLoop, enabled: true } });
}

export function setLoopEnabled(enabled: boolean): void {
  if (!state.loop) return;
  setState({ loop: { ...state.loop, enabled } });
}

export function clearLoop(): void {
  if (state.track) clearLoopStored(state.track.pathKey);
  setState({ loop: null });
}

export function addMarker(label?: string): void {
  const a = el;
  if (!a || !state.track) return;
  const marker: Marker = {
    t: a.currentTime,
    label: label ?? `Marker ${state.markers.length + 1}`,
  };
  const markers = [...state.markers, marker].sort((x, y) => x.t - y.t);
  saveMarkers(state.track.pathKey, markers);
  setState({ markers });
}

export function updateMarker(index: number, label: string): void {
  if (!state.track || !state.markers[index]) return;
  const markers = state.markers.map((m, i) => (i === index ? { ...m, label } : m));
  saveMarkers(state.track.pathKey, markers);
  setState({ markers });
}

export function removeMarker(index: number): void {
  if (!state.track) return;
  const markers = state.markers.filter((_, i) => i !== index);
  saveMarkers(state.track.pathKey, markers);
  setState({ markers });
}

export function jumpToMarker(index: number): void {
  const m = state.markers[index];
  if (m) seekTo(m.t);
}

// ---- lifecycle flush -------------------------------------------------------

if (typeof window !== "undefined") {
  const flush = () => flushPosition();
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}
