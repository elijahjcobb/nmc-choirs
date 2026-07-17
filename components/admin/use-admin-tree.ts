import { useCallback, useEffect, useState } from "react";
import type { TreeResponse } from "@/lib/admin-types";

const EMPTY: TreeResponse = { files: [], folders: [] };

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tree, loading, error, refresh };
}
