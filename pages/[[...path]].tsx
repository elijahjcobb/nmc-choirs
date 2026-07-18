// The single public page. Every folder and file URL renders here; the client
// resolves the current path against the in-memory library index. Shallow
// routing means this component (and the persistent player) never remounts.
import type { GetStaticPaths, GetStaticProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { buildLibraryIndex } from "@/lib/tree";
import type { LibraryIndex } from "@/lib/tree-types";
import { useTree } from "@/hooks/use-tree";
import { useCurrentPath, useShallowNav } from "@/hooks/use-shallow-nav";
import { pathKey } from "@/lib/paths";
import { SiteProvider } from "@/components/site/site-context";
import { AppShell } from "@/components/site/shell/app-shell";
import { MobileHeader } from "@/components/site/shell/mobile-header";
import { FolderPage } from "@/components/site/browse/folder-page";
import { FilePage } from "@/components/site/file/file-page";
import { SearchResults } from "@/components/site/search/search-results";
import { EmptyState } from "@/components/site/browse/empty-state";

interface PageProps {
  index: LibraryIndex;
}

export default function Page({ index }: PageProps) {
  const tree = useTree(index);
  const path = useCurrentPath();
  const navigate = useShallowNav();
  const [query, setQuery] = useState("");

  const key = pathKey(path);
  // Clear the search when navigating to a different folder/file.
  useEffect(() => {
    setQuery("");
  }, [key]);

  const node = tree.getNode(path);
  const searching = query.trim().length > 0;

  const ctx = useMemo(
    () => ({ tree, path, query, setQuery, navigate }),
    [tree, path, query, navigate],
  );

  return (
    <SiteProvider value={ctx}>
      <AppShell>
        {node?.type === "file" ? (
          <FilePage file={node} path={path} />
        ) : (
          <>
            <MobileHeader />
            {searching ? (
              <SearchResults query={query} />
            ) : node?.type === "folder" ? (
              <FolderPage folder={node} path={path} />
            ) : (
              <div className="mx-auto w-full max-w-[820px] p-[clamp(16px,3vw,32px)]">
                <EmptyState
                  icon="search_off"
                  title="Not found"
                  message="This page doesn't exist, or the file was moved or removed."
                />
              </div>
            )}
          </>
        )}
      </AppShell>
    </SiteProvider>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const index = await buildLibraryIndex();
  return { props: { index }, revalidate: 60 };
};
