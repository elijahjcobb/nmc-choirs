// Client access to the whole library index. Renders instantly from the index
// embedded in page props, then silently revalidates via SWR on mount/focus
// (instant-then-refresh). All derived lookups are memoized so navigation and
// search are pure in-memory operations.
import { useMemo } from "react";
import useSWR from "swr";
import type {
  LibraryIndex,
  TreeFileNode,
  TreeFolderNode,
  TreeNode,
} from "@/lib/tree-types";
import { displayName, pathKey } from "@/lib/paths";

async function fetcher(url: string): Promise<LibraryIndex> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`tree fetch failed: ${res.status}`);
  return res.json();
}

export interface FlatEntry {
  node: TreeNode;
  path: string[];
  parentPath: string[];
  /** Lowercased display name, for search. */
  search: string;
}

export interface TreeAccess {
  index: LibraryIndex;
  root: TreeFolderNode;
  /** All nodes keyed by their pathKey. */
  nodeByPath: Map<string, FlatEntry>;
  /** Flat list of every node, for library-wide search. */
  flat: FlatEntry[];
  getNode: (path: string[]) => TreeNode | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

function buildEntries(index: LibraryIndex): {
  nodeByPath: Map<string, FlatEntry>;
  flat: FlatEntry[];
} {
  const nodeByPath = new Map<string, FlatEntry>();
  const flat: FlatEntry[] = [];
  const walk = (folder: TreeFolderNode, path: string[]) => {
    for (const node of folder.children) {
      const childPath = [...path, node.name];
      const entry: FlatEntry = {
        node,
        path: childPath,
        parentPath: path,
        search: displayName(node).toLowerCase(),
      };
      nodeByPath.set(pathKey(childPath), entry);
      flat.push(entry);
      if (node.type === "folder") walk(node, childPath);
    }
  };
  walk(index.root, []);
  return { nodeByPath, flat };
}

export function useTree(fallback: LibraryIndex): TreeAccess {
  const { data, error, isLoading, mutate } = useSWR<LibraryIndex>(
    "/api/tree",
    fetcher,
    {
      fallbackData: fallback,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  const index = data ?? fallback;
  const { nodeByPath, flat } = useMemo(() => buildEntries(index), [index]);

  const getNode = useMemo(() => {
    return (path: string[]): TreeNode | null => {
      if (path.length === 0) return index.root;
      return nodeByPath.get(pathKey(path))?.node ?? null;
    };
  }, [index, nodeByPath]);

  return {
    index,
    root: index.root,
    nodeByPath,
    flat,
    getNode,
    isLoading,
    error,
    refresh: () => {
      void mutate();
    },
  };
}

export type { TreeFileNode, TreeFolderNode, TreeNode };
