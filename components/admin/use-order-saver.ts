import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { pathKey } from "@/lib/admin-client";
import * as actions from "./actions";

const DEBOUNCE_MS = 600;

/**
 * Debounces order saves and serializes the requests so writes can never land
 * out of order. Rapid arrow clicks / successive drags coalesce into one request
 * carrying the latest order per directory; a save issued while one is in flight
 * is chained behind it. Uses a single reused toast (loading -> success/error)
 * rather than the explorer's toast.promise, because a debounced pipeline has no
 * single promise at queue time — keep it this way to preserve coalescing.
 */
export function useOrderSaver(refresh: () => Promise<void>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Map<string, { dir: string[]; names: string[] }>>(new Map());
  const chain = useRef<Promise<void>>(Promise.resolve());
  const toastId = useRef<string | number | undefined>(undefined);

  const flush = useCallback(() => {
    timer.current = null;
    // The batch is read *inside* the chained thunk, so changes queued while a
    // request is in flight coalesce and run strictly afterwards.
    chain.current = chain.current.then(async () => {
      const batch = Array.from(pending.current.values());
      pending.current.clear();
      if (batch.length === 0) return;
      toastId.current = toast.loading("Saving order…", { id: toastId.current });
      try {
        for (const { dir, names } of batch) await actions.saveOrder(dir, names);
        toast.success("Order saved", { id: toastId.current });
      } catch (e) {
        toast.error((e as Error).message, { id: toastId.current });
        await refresh(); // roll back the optimistic order
      }
    });
  }, [refresh]);

  const queueSave = useCallback(
    (dir: string[], names: string[]) => {
      pending.current.set(pathKey(dir), { dir, names }); // latest order per dir wins
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  // Flush any pending change if the explorer unmounts (fetch survives unmount).
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        flush();
      }
    },
    [flush],
  );

  return { queueSave };
}
