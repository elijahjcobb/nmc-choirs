// Folder tile for the grid view.
import { useSite } from "../site-context";
import { Icon } from "../icons";
import type { TreeFolderNode } from "@/lib/tree-types";
import { hrefForPath } from "@/lib/paths";
import { metaFor } from "./entry-row";

export function FolderCard({
  folder,
  fullPath,
  index = 0,
}: {
  folder: TreeFolderNode;
  fullPath: string[];
  index?: number;
}) {
  const { navigate } = useSite();
  return (
    <button
      type="button"
      onClick={() => navigate(hrefForPath(fullPath))}
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
      className="flex animate-[nmc-row-in_0.28s_ease_both] flex-col gap-[11px] rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-brand"
    >
      <Icon name="folder" size={29} filled className="text-brand" />
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-semibold text-ink">
          {folder.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-subtle">
          {metaFor(folder)}
        </span>
      </span>
    </button>
  );
}
