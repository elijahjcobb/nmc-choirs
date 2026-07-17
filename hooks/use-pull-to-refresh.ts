// Custom pull-to-refresh for standalone PWAs (which have no reload button and no
// native overscroll refresh). Active only in display-mode: standalone at the top
// of the page. Returns the current pull distance / refreshing state for an
// indicator to render.
import { useEffect, useState } from "react";

const THRESHOLD = 68;
const MAX = 110;
const DAMP = 0.5;

export interface PullState {
  distance: number;
  refreshing: boolean;
}

export function usePullToRefresh(
  onRefresh: () => Promise<unknown> | void,
): PullState {
  const [state, setState] = useState<PullState>({ distance: 0, refreshing: false });

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (!standalone) return;

    let startY = 0;
    let active = false;
    let pull = 0;

    const start = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        active = true;
        pull = 0;
      }
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      pull = e.touches[0].clientY - startY;
      if (pull > 0 && window.scrollY <= 0) {
        if (pull > 6) e.preventDefault();
        setState({ distance: Math.min(pull * DAMP, MAX), refreshing: false });
      }
    };
    const end = async () => {
      if (!active) return;
      active = false;
      if (pull * DAMP >= THRESHOLD) {
        setState({ distance: THRESHOLD, refreshing: true });
        try {
          await onRefresh();
        } finally {
          setState({ distance: 0, refreshing: false });
        }
      } else {
        setState({ distance: 0, refreshing: false });
      }
      pull = 0;
    };

    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [onRefresh]);

  return state;
}
