import { useRef, useState } from "react";
import {
  Folder,
  FileAudio,
  FileVideo,
  FileText,
  File as FileIcon,
  Eye,
  Download,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { encodePathForRoute } from "@/lib/files";
import {
  DRAG_TYPE,
  iconKindForName,
  formatSize,
  formatDate,
  pathKey,
  type Row,
  type DragPayload,
} from "@/lib/admin-client";

interface Props {
  rows: Row[];
  loading: boolean;
  onOpenFolder: (path: string[]) => void;
  onDropEntry: (payload: DragPayload, targetDir: string[]) => void;
  canDrop: (targetDir: string[]) => boolean;
  onDragStateChange: (payload: DragPayload | null) => void;
  onRename: (row: Row) => void;
  onMove: (row: Row) => void;
  onDelete: (row: Row) => void;
}

function FileGlyph({ name, className }: { name: string; className?: string }) {
  const kind = iconKindForName(name);
  if (kind === "audio") return <FileAudio className={className} />;
  if (kind === "video") return <FileVideo className={className} />;
  if (kind === "pdf" || kind === "text") return <FileText className={className} />;
  return <FileIcon className={className} />;
}

function startDrag(
  e: React.DragEvent,
  row: Row,
  notify: (payload: DragPayload | null) => void,
) {
  const payload: DragPayload = { path: row.path, type: row.type };
  e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "move";
  notify(payload);
}

export function FileList({
  rows,
  loading,
  onOpenFolder,
  onDropEntry,
  canDrop,
  onDragStateChange,
  onRename,
  onMove,
  onDelete,
}: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Single click opens the context menu (via a synthetic contextmenu event);
  // double click opens the item. A short timer disambiguates the two.
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const { clientX, clientY } = e;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      el.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, clientX, clientY }),
      );
    }, 220);
  }
  function open(action: () => void) {
    return () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      action();
    };
  }

  function view(row: Row) {
    // Public files now live at /<path> (no /view prefix).
    window.open(encodePathForRoute(row.path), "_blank", "noopener");
  }
  function download(row: Row) {
    if (row.file) window.open(row.file.downloadUrl, "_blank", "noopener");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full min-h-48 items-center justify-center text-sm">
        This folder is empty.
      </div>
    );
  }

  const folders = rows.filter((r) => r.type === "directory");
  const files = rows.filter((r) => r.type === "file");

  const folderMenu = (row: Row) => (
    <ContextMenuContent className="w-44">
      <ContextMenuItem onSelect={() => onOpenFolder(row.path)}>
        <Folder className="size-4" /> Open
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => onRename(row)}>
        <Pencil className="size-4" /> Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => onMove(row)}>
        <FolderInput className="size-4" /> Move to…
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onSelect={() => onDelete(row)}>
        <Trash2 className="size-4" /> Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  const fileMenu = (row: Row) => (
    <ContextMenuContent className="w-44">
      <ContextMenuItem onSelect={() => view(row)}>
        <Eye className="size-4" /> View
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => download(row)}>
        <Download className="size-4" /> Download
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => onRename(row)}>
        <Pencil className="size-4" /> Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => onMove(row)}>
        <FolderInput className="size-4" /> Move to…
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onSelect={() => onDelete(row)}>
        <Trash2 className="size-4" /> Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {folders.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Folders
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {folders.map((row) => {
              const key = pathKey(row.path);
              const isDropTarget = dragOver === key;
              return (
                <ContextMenu key={key}>
                  <ContextMenuTrigger asChild>
                    <div
                      draggable
                      onDragStart={(e) => startDrag(e, row, onDragStateChange)}
                      onDragEnd={() => onDragStateChange(null)}
                      onDragOver={(e) => {
                        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                        if (!canDrop(row.path)) return; // invalid target: no accept, no highlight
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOver(key);
                      }}
                      onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
                      onDrop={(e) => {
                        if (!canDrop(row.path)) return;
                        const raw = e.dataTransfer.getData(DRAG_TYPE);
                        setDragOver(null);
                        if (!raw) return;
                        e.preventDefault();
                        try {
                          onDropEntry(JSON.parse(raw) as DragPayload, row.path);
                        } catch {
                          /* ignore malformed drag data */
                        }
                      }}
                      onClick={() => onOpenFolder(row.path)}
                      className={cn(
                        "hover:bg-accent flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center select-none",
                        isDropTarget && "ring-ring bg-accent ring-2",
                      )}
                    >
                      <Folder className="text-muted-foreground size-12" />
                      <span className="w-full truncate text-sm font-medium">{row.name}</span>
                    </div>
                  </ContextMenuTrigger>
                  {folderMenu(row)}
                </ContextMenu>
              );
            })}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Files
          </h2>
          <div className="overflow-hidden rounded-md border">
            <div className="text-muted-foreground bg-muted/50 flex items-center gap-3 border-b px-3 py-2 text-xs font-medium">
              <span className="flex-1">Name</span>
              <span className="w-24 text-right">Size</span>
              <span className="hidden w-28 text-right sm:inline">Modified</span>
            </div>
            {files.map((row) => (
              <ContextMenu key={pathKey(row.path)}>
                <ContextMenuTrigger asChild>
                  <div
                    draggable
                    onDragStart={(e) => startDrag(e, row, onDragStateChange)}
                    onDragEnd={() => onDragStateChange(null)}
                    onClick={openMenu}
                    onDoubleClick={open(() => view(row))}
                    className="hover:bg-accent flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-sm select-none last:border-b-0"
                  >
                    <FileGlyph name={row.name} className="text-muted-foreground size-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{row.name}</span>
                    <span className="text-muted-foreground w-24 shrink-0 text-right tabular-nums">
                      {row.file ? formatSize(row.file.size) : ""}
                    </span>
                    <span className="text-muted-foreground hidden w-28 shrink-0 text-right sm:inline">
                      {row.file ? formatDate(row.file.uploadedAt) : ""}
                    </span>
                  </div>
                </ContextMenuTrigger>
                {fileMenu(row)}
              </ContextMenu>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
