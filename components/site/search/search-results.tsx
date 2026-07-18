// Library-wide instant search over the in-memory index (names of files & folders).
import { useMemo } from "react";
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { EntryRow } from "../browse/entry-row";
import { EmptyState } from "../browse/empty-state";

const MAX_RESULTS = 60;

export function SearchResults({ query }: { query: string }) {
  const { tree, setQuery } = useSite();
  const q = query.trim().toLowerCase();

  const results = useMemo(
    () => tree.flat.filter((entry) => entry.search.includes(q)).slice(0, MAX_RESULTS),
    [tree.flat, q],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-[18px] p-[clamp(16px,3vw,32px)]">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[clamp(20px,2.2vw,24px)] font-bold tracking-[-0.01em] text-ink">
            Search results
          </div>
          <div className="mt-0.5 text-[13px] text-subtle">
            {results.length} match{results.length === 1 ? "" : "es"} for “{query.trim()}”
            across the whole library
          </div>
        </div>
        <button
          type="button"
          onClick={() => setQuery("")}
          className="flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-[7px] text-[12.5px] font-medium text-subtle transition-colors hover:border-brand hover:text-brand"
        >
          <Icon name="close" size={16} />
          Clear
        </button>
      </div>

      {results.length > 0 ? (
        <div className="flex flex-col gap-[9px]">
          {results.map((entry, i) => (
            <EntryRow
              key={entry.path.join("/")}
              node={entry.node}
              fullPath={entry.path}
              index={i}
              subtitle={["Home", ...entry.parentPath].join(" / ")}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search_off"
          title="No matches"
          message={`Try a piece title, ensemble, or part name — like “Gloria” or “soprano”.`}
        />
      )}
    </div>
  );
}
