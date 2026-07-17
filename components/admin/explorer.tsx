import { Fragment, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { FolderPlus, Upload, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ACCEPT } from "@/lib/files";
import {
  directoryContents,
  parentOf,
  pathKey,
  isSelfOrDescendant,
  type Row,
  type DragPayload,
} from "@/lib/admin-client";
import type { EntryType } from "@/lib/admin-types";
import * as actions from "./actions";
import { useAdminTree } from "./use-admin-tree";
import { useOrderSaver } from "./use-order-saver";
import { useUploads } from "./use-uploads";
import { Tree } from "./tree";
import { FileList } from "./file-list";
import { UploadZone } from "./upload-zone";
import { NewFolderDialog } from "./new-folder-dialog";
import { RenameDialog } from "./rename-dialog";
import { MoveDialog } from "./move-dialog";
import { DeleteDialog } from "./delete-dialog";

export function AdminExplorer() {
  const router = useRouter();
  const { tree, loading, error, refresh, setOrder } = useAdminTree();
  const orderSaver = useOrderSaver(refresh);
  const uploads = useUploads(refresh);
  const [cwd, setCwd] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Whether the currently-dragged entry may be dropped on `targetDir`. Invalid
  // targets (its current parent, itself, or a descendant) don't highlight and
  // won't accept the drop, so a cancelled drag is simply released with no error.
  function canDropOn(targetDir: string[]): boolean {
    if (!dragging) return false;
    const from = dragging.path;
    if (pathKey(targetDir) === pathKey(parentOf(from))) return false;
    if (dragging.type === "directory" && isSelfOrDescendant(from, targetDir)) return false;
    return true;
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      const max = window.innerWidth * 0.5;
      setSidebarWidth(Math.min(max, Math.max(100, ev.clientX)));
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameRow, setRenameRow] = useState<Row | null>(null);
  const [moveRow, setMoveRow] = useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const rows = useMemo(() => directoryContents(tree, cwd), [tree, cwd]);

  /** Keep cwd valid when a folder it points into is moved or removed. */
  function remapCwd(from: string[], to: string[] | null) {
    setCwd((current) =>
      !isSelfOrDescendant(from, current)
        ? current
        : to
          ? [...to, ...current.slice(from.length)]
          : parentOf(from),
    );
  }

  /** Wrap an async mutation in a loading→success/error toast. Returns success. */
  async function withToast(
    promise: Promise<unknown>,
    loading: string,
    success: string,
  ): Promise<boolean> {
    toast.promise(promise, { loading, success, error: (e: Error) => e.message });
    try {
      await promise;
      return true;
    } catch {
      return false;
    }
  }

  async function doMove(from: string[], type: EntryType, targetDir: string[]) {
    // A drop onto the current parent, or a folder onto itself/a descendant, is
    // treated as a cancelled drag — silently do nothing, no error toast.
    if (pathKey(targetDir) === pathKey(parentOf(from))) return;
    const to = [...targetDir, from[from.length - 1]];
    if (type === "directory" && isSelfOrDescendant(from, to)) return;
    if (await withToast(actions.moveEntry(from, to, type), "Moving…", "Moved")) {
      if (type === "directory") remapCwd(from, to);
      await refresh();
    }
  }

  function handleDropEntry(payload: DragPayload, targetDir: string[]) {
    doMove(payload.path, payload.type, targetDir);
  }

  /** Reorder files in the current directory. `names` is the full visible order. */
  function handleReorder(names: string[]) {
    setOrder(cwd, names); // optimistic — rows recompute via directoryContents
    orderSaver.queueSave(cwd, names);
  }

  async function handleCreateFolder(name: string) {
    if (rows.some((r) => r.name === name)) {
      toast.error("An item with that name already exists.");
      return;
    }
    if (await withToast(actions.createFolder([...cwd, name]), "Creating folder…", "Folder created")) {
      setNewFolderOpen(false);
      await refresh();
    }
  }

  async function handleRename(row: Row, newName: string) {
    const siblings = directoryContents(tree, parentOf(row.path));
    if (siblings.some((i) => i.name === newName && pathKey(i.path) !== pathKey(row.path))) {
      toast.error("An item with that name already exists.");
      return;
    }
    const to = [...parentOf(row.path), newName];
    if (await withToast(actions.moveEntry(row.path, to, row.type), "Renaming…", "Renamed")) {
      if (row.type === "directory") remapCwd(row.path, to);
      setRenameRow(null);
      await refresh();
    }
  }

  async function handleMove(row: Row, targetDir: string[]) {
    const to = [...targetDir, row.name];
    if (await withToast(actions.moveEntry(row.path, to, row.type), "Moving…", "Moved")) {
      if (row.type === "directory") remapCwd(row.path, to);
      setMoveRow(null);
      await refresh();
    }
  }

  async function handleDelete(row: Row) {
    if (await withToast(actions.deleteEntry(row.path, row.type), "Deleting…", "Deleted")) {
      if (row.type === "directory") remapCwd(row.path, null);
      setDeleteRow(null);
      await refresh();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace(router.asPath);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) uploads.uploadFiles(files, cwd);
    e.target.value = "";
  }

  const uploadsDone =
    uploads.items.length > 0 && uploads.items.every((i) => i.status !== "uploading");

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="shrink-0 font-semibold">NMC Music Admin</span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {cwd.length === 0 ? (
                  <BreadcrumbPage>All Files</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={() => setCwd([])}>
                      All Files
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {cwd.map((seg, i) => (
                <Fragment key={i}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {i === cwd.length - 1 ? (
                      <BreadcrumbPage>{seg}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button type="button" onClick={() => setCwd(cwd.slice(0, i + 1))}>
                          {seg}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="size-4" /> New folder
        </Button>
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          <Upload className="size-4" /> Upload
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="size-4" /> Log out
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={onPickFiles}
        />
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <aside style={{ width: sidebarWidth }} className="shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <Tree
                tree={tree}
                cwd={cwd}
                onNavigate={setCwd}
                onDropEntry={handleDropEntry}
                canDrop={canDropOn}
                onDragStateChange={setDragging}
                onRename={setRenameRow}
                onMove={setMoveRow}
                onDelete={setDeleteRow}
              />
            </div>
          </ScrollArea>
        </aside>
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={startResize}
          className="group relative w-2 shrink-0 cursor-col-resize"
          title="Drag to resize"
        >
          <div className="bg-border group-hover:bg-ring absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors" />
        </div>
        <main className="flex min-w-0 flex-1 flex-col">
          {error ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              Failed to load files.
              <button className="ml-1 underline" onClick={refresh}>
                Retry
              </button>
            </div>
          ) : (
            <UploadZone cwd={cwd} onFiles={(files) => uploads.uploadFiles(files, cwd)}>
              <FileList
                rows={rows}
                loading={loading}
                cwd={cwd}
                dragging={dragging}
                onReorder={handleReorder}
                onOpenFolder={setCwd}
                onDropEntry={handleDropEntry}
                canDrop={canDropOn}
                onDragStateChange={setDragging}
                onRename={setRenameRow}
                onMove={setMoveRow}
                onDelete={setDeleteRow}
              />
            </UploadZone>
          )}
        </main>
      </div>

      {/* Upload progress */}
      {uploads.items.length > 0 && (
        <div className="bg-background fixed right-4 bottom-4 z-20 w-80 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
            <span>Uploads</span>
            {uploadsDone && (
              <button onClick={uploads.clear} aria-label="Dismiss">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex max-h-64 flex-col gap-3 overflow-auto p-3">
            {uploads.items.map((it) => (
              <div key={it.id} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{it.name}</span>
                  <span
                    className={
                      it.status === "error"
                        ? "text-destructive shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  >
                    {it.status === "done"
                      ? "Done"
                      : it.status === "error"
                        ? "Failed"
                        : `${it.progress}%`}
                  </span>
                </div>
                {it.status !== "error" && (
                  <Progress value={it.progress} className="mt-1.5 h-1.5" />
                )}
                {it.error && <p className="text-destructive mt-1">{it.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        cwd={cwd}
        onCreate={handleCreateFolder}
      />
      <RenameDialog
        row={renameRow}
        onOpenChange={(o) => !o && setRenameRow(null)}
        onRename={handleRename}
      />
      <MoveDialog
        row={moveRow}
        tree={tree}
        onOpenChange={(o) => !o && setMoveRow(null)}
        onMove={handleMove}
      />
      <DeleteDialog
        row={deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
