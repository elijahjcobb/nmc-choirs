// React bindings for the module-level player store. Two hooks so the frequent
// time channel never re-renders components that only care about track/status.
import { useSyncExternalStore } from "react";
import {
  getState,
  getTime,
  INITIAL_STATE,
  INITIAL_TIME,
  subscribeState,
  subscribeTime,
  type PlayerState,
  type TimeState,
} from "./player-store";

export function usePlayerState(): PlayerState {
  return useSyncExternalStore(subscribeState, getState, () => INITIAL_STATE);
}

export function usePlayerTime(): TimeState {
  return useSyncExternalStore(subscribeTime, getTime, () => INITIAL_TIME);
}
