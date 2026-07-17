import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tree } from "./tree";
import type { TreeResponse } from "@/lib/admin-types";
import {
  parentOf,
  pathKey,
  isSelfOrDescendant,
  type Row,
} from "@/lib/admin-client";

interface Props {
  row: Row | null;
  tree: TreeResponse;
  onOpenChange: (open: boolean) => void;
  onMove: (row: Row, targetDir: string[]) => Promise<void>;
}

export function MoveDialog({ row, tree, onOpenChange, onMove }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (row) setSelected([]);
  }, [row]);

  const currentParent = row ? parentOf(row.path) : [];
  const isDisabled = (path: string[]) => {
    if (!row) return true;
    if (pathKey(path) === pathKey(currentParent)) return true;
    if (row.type === "directory" && isSelfOrDescendant(row.path, path)) return true;
    return false;
  };
  const canMove = row ? !isDisabled(selected) : false;

  async function confirm() {
    if (!row || !canMove) return;
    setBusy(true);
    await onMove(row, selected);
    setBusy(false);
  }

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move “{row?.name}”</DialogTitle>
          <DialogDescription>Choose a destination folder.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 rounded-md border">
          {row && (
            <Tree
              tree={tree}
              cwd={selected}
              onNavigate={setSelected}
              picker
              isDisabled={isDisabled}
            />
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !canMove} onClick={confirm}>
            Move here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
