import { useCallback, useEffect, useState } from "react";
import type { TreeResponse } from "@/lib/admin-types";
import { pathKey } from "@/lib/admin-client";

const EMPTY: TreeResponse = { files: [], folders: [], orders: {} };

export function useAdminTree() {
  const [tree, setTree] = useState<TreeResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tree");
      if (!res.ok) throw new Error();
      setTree((await res.json()) as TreeResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistically set a directory's file order; rolled back by refresh() on save failure. */
  const setOrder = useCallback((dir: string[], names: string[]) => {
    setTree((prev) => ({
      ...prev,
      orders: { ...prev.orders, [pathKey(dir)]: names },
    }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tree, loading, error, refresh, setOrder };
}
