import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Row } from "@/lib/admin-client";

interface Props {
  row: Row | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (row: Row) => Promise<void>;
}

export function DeleteDialog({ row, onOpenChange, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const isDir = row?.type === "directory";

  async function confirm() {
    if (!row) return;
    setBusy(true);
    await onConfirm(row);
    setBusy(false);
  }

  return (
    <AlertDialog open={!!row} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isDir ? "folder" : "file"} “{row?.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDir
              ? "This permanently deletes the folder and everything inside it."
              : "This permanently deletes the file."}{" "}
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
