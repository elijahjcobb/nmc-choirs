// Shared state for the public app: the loaded library, the current path, the
// library-wide search query, and the shallow navigate() helper. Avoids prop
// drilling through the shell, sidebar, and browse components.
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { TreeAccess } from "@/hooks/use-tree";

export interface SiteContextValue {
  tree: TreeAccess;
  path: string[];
  query: string;
  setQuery: (q: string) => void;
  navigate: (href: string, opts?: { replace?: boolean }) => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  value,
  children,
}: {
  value: SiteContextValue;
  children: ReactNode;
}) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within a SiteProvider");
  return ctx;
}
