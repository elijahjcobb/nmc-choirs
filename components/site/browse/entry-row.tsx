// A single browse row — used for folders (list view), files, and search results.
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { visualFor } from "../visuals";
import type { TreeNode } from "@/lib/tree-types";
import { displayName, formatDate, formatSize, hrefForPath } from "@/lib/paths";

export function metaFor(node: TreeNode): string {
  if (node.type === "folder") {
    const n = node.children.length;
    return `${n} item${n === 1 ? "" : "s"}`;
  }
  return `${formatSize(node.size)} · ${formatDate(node.mtime)}`;
}

export function EntryRow({
  node,
  fullPath,
  index = 0,
  subtitle,
}: {
  node: TreeNode;
  fullPath: string[];
  index?: number;
  subtitle?: string;
}) {
  const { navigate } = useSite();
  const visual = visualFor(node);
  return (
    <button
      type="button"
      onClick={() => navigate(hrefForPath(fullPath))}
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
      className="flex animate-[nmc-row-in_0.28s_ease_both] items-center gap-[13px] rounded-[14px] border border-line bg-surface px-[15px] py-[13px] text-left transition-colors hover:border-brand"
    >
      <span
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${visual.tile}`}
      >
        <Icon name={visual.icon} size={23} filled />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-ink">
          {displayName(node)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-subtle">
          {subtitle ?? metaFor(node)}
        </span>
      </span>
      <Icon name="chevron_right" size={21} className="shrink-0 text-faint" />
    </button>
  );
}
