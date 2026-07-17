// Small, dependency-free localStorage layer with a write-through in-memory cache
// (so reads are synchronous even inside a tap handler), corrupt-data guards, and
// quota-safe writes. Persistence is always an enhancement — if storage is
// unavailable (private mode, quota), the memory cache still serves the session.
const NS = "nmc:v1:";

const memory = new Map<string, unknown>();

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

/** Read a scalar/object value, validating shape; falls back (and self-heals) on corruption. */
export function readValue<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  if (memory.has(key)) return memory.get(key) as T;
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    if (raw == null) {
      memory.set(key, fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      window.localStorage.removeItem(NS + key);
      memory.set(key, fallback);
      return fallback;
    }
    memory.set(key, parsed);
    return parsed as T;
  } catch {
    memory.set(key, fallback);
    return fallback;
  }
}

export function writeValue<T>(key: string, value: T): void {
  memory.set(key, value);
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode: keep the memory cache for this session.
  }
}

export interface Stamped {
  /** epoch ms of last touch, for LRU pruning. */
  at: number;
}

/**
 * Update one entry of a `Record<string, V>` map with LRU pruning to `cap`
 * entries (oldest `at` dropped). Used for per-file positions/markers/etc.
 */
export function writeMapEntry<V extends Stamped>(
  key: string,
  id: string,
  value: V,
  cap: number,
): void {
  const map = readValue<Record<string, V>>(key, {});
  const next: Record<string, V> = { ...map, [id]: value };
  const ids = Object.keys(next);
  if (ids.length > cap) {
    ids
      .sort((a, b) => (next[a].at ?? 0) - (next[b].at ?? 0))
      .slice(0, ids.length - cap)
      .forEach((old) => delete next[old]);
  }
  writeValue(key, next);
}

export function readMapEntry<V>(key: string, id: string): V | undefined {
  return readValue<Record<string, V>>(key, {})[id];
}

export function deleteMapEntry(key: string, id: string): void {
  const map = readValue<Record<string, unknown>>(key, {});
  if (id in map) {
    const next = { ...map };
    delete next[id];
    writeValue(key, next);
  }
}
