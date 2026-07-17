import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  HardDrive,
  Pencil,
  FolderInput,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { TreeResponse } from "@/lib/admin-types";
import {
  childFolders,
  pathKey,
  DRAG_TYPE,
  type DragPayload,
  type Row,
} from "@/lib/admin-client";

interface TreeProps {
  tree: TreeResponse;
  cwd: string[];
  onNavigate: (path: string[]) => void;
  /** Picker mode (move dialog): no drag-and-drop or context menu; some nodes disabled. */
  picker?: boolean;
  isDisabled?: (path: string[]) => boolean;
  /** Sidebar mode: called when an entry is dropped onto a folder node. */
  onDropEntry?: (payload: DragPayload, targetDir: string[]) => void;
  /** Whether the in-progress drag may be dropped on this folder path. */
  canDrop?: (targetDir: string[]) => boolean;
  /** Notified with the payload on drag start, and null on drag end. */
  onDragStateChange?: (payload: DragPayload | null) => void;
  onRename?: (row: Row) => void;
  onMove?: (row: Row) => void;
  onDelete?: (row: Row) => void;
}

export function Tree({
  tree,
  cwd,
  onNavigate,
  picker,
  isDisabled,
  onDropEntry,
  canDrop,
  onDragStateChange,
  onRename,
  onMove,
  onDelete,
}: TreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [dragOver, setDragOver] = useState<string | null>(null);
  const autoExpanded = useRef<Set<string>>(new Set());

  // Auto-expand the ancestors of the current directory.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add("");
      for (let i = 1; i <= cwd.length; i++) next.add(pathKey(cwd.slice(0, i)));
      return next;
    });
  }, [cwd]);

  // Expand every folder by default the first time it appears (newly created
  // folders too), while preserving folders the user has manually collapsed.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const folder of tree.folders) {
        const key = pathKey(folder);
        if (!autoExpanded.current.has(key)) {
          autoExpanded.current.add(key);
          next.add(key);
        }
      }
      return next;
    });
  }, [tree.folders]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const hasMenu = !picker && (onRename || onMove || onDelete);

  function renderNode(path: string[], depth: number) {
    const key = pathKey(path);
    const isRoot = path.length === 0;
    const children = childFolders(tree, path);
    const hasChildren = children.length > 0;
    const isOpen = expanded.has(key);
    const isActive = key === pathKey(cwd);
    const disabled = picker && isDisabled ? isDisabled(path) : false;
    const isDropTarget = dragOver === key;
    const draggable = !picker && !isRoot && !!onDropEntry;
    const row: Row = { type: "directory", name: path[path.length - 1] ?? "", path };

    const rowEl = (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        draggable={draggable}
        onDragStart={(e) => {
          if (!draggable) return;
          const payload: DragPayload = { path, type: "directory" };
          e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "move";
          onDragStateChange?.(payload);
        }}
        onDragEnd={() => onDragStateChange?.(null)}
        onClick={() => !disabled && onNavigate(path)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNavigate(path);
          }
        }}
        onDragOver={(e) => {
          if (picker || disabled || !onDropEntry) return;
          if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
          if (canDrop && !canDrop(path)) return; // invalid target: no accept, no highlight
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(key);
        }}
        onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
        onDrop={(e) => {
          if (picker || disabled || !onDropEntry) return;
          if (canDrop && !canDrop(path)) return;
          const raw = e.dataTransfer.getData(DRAG_TYPE);
          setDragOver(null);
          if (!raw) return;
          e.preventDefault();
          try {
            onDropEntry(JSON.parse(raw) as DragPayload, path);
          } catch {
            /* ignore malformed drag data */
          }
        }}
        className={cn(
          "flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm select-none",
          disabled
            ? "text-muted-foreground/50 cursor-not-allowed"
            : "hover:bg-accent cursor-pointer",
          isActive && !disabled && "bg-accent font-medium",
          isDropTarget && "ring-ring ring-2 ring-inset",
        )}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <span
          className="flex size-4 shrink-0 items-center justify-center"
          onClick={(e) => {
            if (!hasChildren) return;
            e.stopPropagation();
            toggle(key);
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={cn("size-4 transition-transform", isOpen && "rotate-90")}
            />
          )}
        </span>
        {isRoot ? (
          <HardDrive className="size-4 shrink-0" />
        ) : isOpen && hasChildren ? (
          <FolderOpen className="size-4 shrink-0" />
        ) : (
          <Folder className="size-4 shrink-0" />
        )}
        <span className="truncate">{isRoot ? "All Files" : path[path.length - 1]}</span>
      </div>
    );

    return (
      <div key={key || "__root__"}>
        {hasMenu && !isRoot ? (
          <ContextMenu>
            <ContextMenuTrigger asChild>{rowEl}</ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuItem onSelect={() => onNavigate(path)}>
                <Folder className="size-4" /> Open
              </ContextMenuItem>
              <ContextMenuSeparator />
              {onRename && (
                <ContextMenuItem onSelect={() => onRename(row)}>
                  <Pencil className="size-4" /> Rename
                </ContextMenuItem>
              )}
              {onMove && (
                <ContextMenuItem onSelect={() => onMove(row)}>
                  <FolderInput className="size-4" /> Move to…
                </ContextMenuItem>
              )}
              {onDelete && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onSelect={() => onDelete(row)}>
                    <Trash2 className="size-4" /> Delete
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          rowEl
        )}
        {isOpen && children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return <div className="py-1">{renderNode([], 0)}</div>;
}
