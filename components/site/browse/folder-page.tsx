// Folder browse screen: breadcrumbs + view toggle, title, then FOLDERS
// (grid/list) and FILES sections. Child order is server-defined (admin order);
// the visitor never re-sorts.
import { Breadcrumbs } from "../shell/breadcrumbs";
import { ViewToggle } from "./view-toggle";
import { SectionLabel } from "./section-label";
import { FolderCard } from "./folder-card";
import { EntryRow } from "./entry-row";
import { EmptyState } from "./empty-state";
import { useViewMode } from "@/hooks/use-view-mode";
import type { TreeFolderNode } from "@/lib/tree-types";

export function FolderPage({
  folder,
  path,
}: {
  folder: TreeFolderNode;
  path: string[];
}) {
  const [view] = useViewMode();

  const folders = folder.children.filter((c) => c.type === "folder");
  const files = folder.children.filter((c) => c.type === "file");
  const nfo = folders.length;
  const nfi = files.length;

  const title = path.length ? path[path.length - 1] : "Library";
  const parentTrail = path.length > 1 ? `Home / ${path.slice(0, -1).join(" / ")} · ` : path.length === 1 ? "Home · " : "";
  const subtitle = `${parentTrail}${nfo} folder${nfo === 1 ? "" : "s"} · ${nfi} file${nfi === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-[18px] p-[clamp(16px,3vw,32px)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>
        {nfo > 0 && <ViewToggle />}
      </div>

      <div>
        <div className="text-[clamp(22px,2.4vw,27px)] font-bold tracking-[-0.01em] text-ink">
          {title}
        </div>
        <div className="mt-0.5 text-[13px] text-subtle">{subtitle}</div>
      </div>

      {nfo > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel>FOLDERS</SectionLabel>
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
              {folders.map((f, i) => (
                <FolderCard key={f.name} folder={f} fullPath={[...path, f.name]} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[9px]">
              {folders.map((f, i) => (
                <EntryRow key={f.name} node={f} fullPath={[...path, f.name]} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {nfi > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel>FILES</SectionLabel>
          <div className="flex flex-col gap-[9px]">
            {files.map((f, i) => (
              <EntryRow key={f.name} node={f} fullPath={[...path, f.name]} index={i} />
            ))}
          </div>
        </section>
      )}

      {nfo === 0 && nfi === 0 && (
        <EmptyState
          icon="folder"
          title="This folder is empty"
          message="Nothing here yet. Check back after your director uploads new material."
        />
      )}
    </div>
  );
}
