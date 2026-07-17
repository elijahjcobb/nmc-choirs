// Media Session integration: lock-screen / control-center metadata, transport
// handlers, and position state. Every call is feature-detected and guarded — the
// API is partial on older iOS and setPositionState throws on transient bad values.
export interface MediaHandlers {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (t: number) => void;
  seekBy: (delta: number) => void;
}

function ms(): MediaSession | null {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return null;
  return navigator.mediaSession;
}

export function setupMediaSession(h: MediaHandlers): void {
  const session = ms();
  if (!session) return;
  const set = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try {
      session.setActionHandler(action, handler);
    } catch {
      /* unsupported action */
    }
  };
  set("play", () => h.play());
  set("pause", () => h.pause());
  set("seekbackward", (d) => h.seekBy(-(d.seekOffset ?? 10)));
  set("seekforward", (d) => h.seekBy(d.seekOffset ?? 10));
  set("seekto", (d) => {
    if (typeof d.seekTime === "number") h.seekTo(d.seekTime);
  });
  set("previoustrack", () => h.previous());
  set("nexttrack", () => h.next());
}

export function setMetadata(title: string, artist: string): void {
  const session = ms();
  if (!session || typeof MediaMetadata === "undefined") return;
  try {
    session.metadata = new MediaMetadata({
      title,
      artist,
      album: "NMC Music",
      artwork: [
        { src: "/artwork-192.png", sizes: "192x192", type: "image/png" },
        { src: "/artwork-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  } catch {
    /* ignore */
  }
}

export function setPlaybackState(state: MediaSessionPlaybackState): void {
  const session = ms();
  if (!session) return;
  try {
    session.playbackState = state;
  } catch {
    /* ignore */
  }
}

export function setPositionState(
  duration: number,
  position: number,
  playbackRate: number,
): void {
  const session = ms();
  if (!session || typeof session.setPositionState !== "function") return;
  if (!Number.isFinite(duration) || duration <= 0) return;
  if (!Number.isFinite(position) || position < 0 || position > duration) return;
  try {
    session.setPositionState({ duration, position, playbackRate: playbackRate || 1 });
  } catch {
    /* ignore */
  }
}
