import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateEntryName, isAllowedFile } from "@/lib/files";
import type { Row } from "@/lib/admin-client";

interface Props {
  row: Row | null;
  onOpenChange: (open: boolean) => void;
  onRename: (row: Row, newName: string) => Promise<void>;
}

export function RenameDialog({ row, onOpenChange, onRename }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (row) setName(row.name);
  }, [row]);

  let error = name.length > 0 ? validateEntryName(name) : null;
  if (!error && row?.type === "file" && name.length > 0 && !isAllowedFile(name)) {
    error = "File must keep an allowed extension.";
  }
  const unchanged = row ? name === row.name : true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || error || name.length === 0 || unchanged) return;
    setBusy(true);
    await onRename(row, name.trim());
    setBusy(false);
  }

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Rename {row?.type === "directory" ? "folder" : "file"}</DialogTitle>
            <DialogDescription>Enter a new name.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !!error || name.length === 0 || unchanged}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
