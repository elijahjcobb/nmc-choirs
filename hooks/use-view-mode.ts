// Persisted grid/list preference for the folder browser, shared across the app
// via a tiny external store so the toolbar toggle and the folder grid stay in
// sync and the choice survives navigation.
import { useSyncExternalStore } from "react";
import { readValue, writeValue } from "@/lib/storage/storage";

export type ViewMode = "grid" | "list";
const KEY = "ui.view";

function isViewMode(v: unknown): v is ViewMode {
  return v === "grid" || v === "list";
}

let current: ViewMode | null = null;
const listeners = new Set<() => void>();

function get(): ViewMode {
  if (current === null) current = readValue<ViewMode>(KEY, "grid", isViewMode);
  return current;
}

function set(mode: ViewMode): void {
  current = mode;
  writeValue(KEY, mode);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(subscribe, get, () => "grid" as ViewMode);
  return [mode, set];
}
