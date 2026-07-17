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
import { validateEntryName } from "@/lib/files";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cwd: string[];
  onCreate: (name: string) => void | Promise<void>;
}

export function NewFolderDialog({ open, onOpenChange, cwd, onCreate }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const error = name.length > 0 ? validateEntryName(name) : null;
  const location = cwd.length ? cwd.join(" / ") : "All Files";

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (error || name.length === 0) return;
    setBusy(true);
    await onCreate(name.trim());
    setBusy(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setName("");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>Create a folder in {location}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              placeholder="Folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || name.length === 0 || !!error}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
