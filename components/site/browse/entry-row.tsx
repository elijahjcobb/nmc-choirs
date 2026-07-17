// A single browse row — used for folders (list view), files, and search results.
// Opens on tap; a ⋮ button / right-click / long-press opens the share menu.
import { useRef, useState } from "react";
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { visualFor } from "../visuals";
import { playAudioFile } from "../player/play-file";
import { ShareMenu } from "./share-menu";
import type { TreeNode } from "@/lib/tree-types";
import { displayName, formatDate, formatSize, hrefForPath, kindOf } from "@/lib/paths";

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
  const { tree, navigate } = useSite();
  const visual = visualFor(node);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useRef<number | undefined>(undefined);

  const open = () => {
    if (node.type === "file" && kindOf(node.ext) === "audio") {
      playAudioFile(tree, node, fullPath);
    }
    navigate(hrefForPath(fullPath));
  };

  const startLongPress = () => {
    longPress.current = window.setTimeout(() => setMenuOpen(true), 500);
  };
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current);
  };

  return (
    <div className="relative flex animate-[nmc-row-in_0.28s_ease_both] items-center gap-[13px] rounded-[14px] border border-line bg-surface pr-2 transition-colors hover:border-brand" style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}>
      <button
        type="button"
        onClick={open}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        className="flex min-w-0 flex-1 items-center gap-[13px] py-[13px] pl-[15px] text-left"
      >
        <span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${visual.tile}`}>
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
      </button>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="More options"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-nav-hover hover:text-ink"
      >
        <Icon name="more_vert" size={20} />
      </button>
      <Icon name="chevron_right" size={21} className="mr-1 shrink-0 text-faint" />
      {menuOpen && (
        <ShareMenu node={node} path={fullPath} open={menuOpen} onOpenChange={setMenuOpen} />
      )}
    </div>
  );
}
