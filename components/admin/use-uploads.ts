import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { isAllowedFile, BLOB_ROOT } from "@/lib/files";
import { revalidatePath } from "./actions";

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

const CONCURRENCY = 3;
const MULTIPART_THRESHOLD = 50 * 1024 * 1024;

export function useUploads(onComplete: () => void | Promise<void>) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const clear = useCallback(() => setItems([]), []);

  const uploadFiles = useCallback(
    async (files: File[], cwd: string[]) => {
      const allowed = files.filter((f) => isAllowedFile(f.name));
      const rejected = files.length - allowed.length;
      if (rejected > 0) {
        toast.error(`Skipped ${rejected} unsupported file${rejected > 1 ? "s" : ""}.`);
      }
      if (allowed.length === 0) return;

      const queued = allowed.map((file, i) => ({
        item: {
          id: `${Date.now()}-${i}-${file.name}`,
          name: file.name,
          progress: 0,
          status: "uploading" as const,
        } satisfies UploadItem,
        file,
      }));
      setItems((prev) => [...prev, ...queued.map((q) => q.item)]);

      const update = (id: string, patch: Partial<UploadItem>) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

      let cursor = 0;
      let succeeded = 0;
      let failed = 0;
      const worker = async () => {
        while (cursor < queued.length) {
          const { item, file } = queued[cursor++];
          try {
            await upload(BLOB_ROOT + [...cwd, file.name].join("/"), file, {
              access: "public",
              handleUploadUrl: "/api/admin/upload",
              multipart: file.size > MULTIPART_THRESHOLD,
              onUploadProgress: ({ percentage }) =>
                update(item.id, { progress: percentage }),
            });
            update(item.id, { status: "done", progress: 100 });
            succeeded++;
          } catch (e) {
            update(item.id, { status: "error", error: (e as Error).message });
            failed++;
          }
        }
      };

      const run = (async () => {
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, queued.length) }, worker),
        );
        if (succeeded > 0) {
          await onComplete();
          await revalidatePath(cwd);
        }
        if (failed > 0) {
          throw new Error(
            succeeded > 0
              ? `Uploaded ${succeeded}, ${failed} failed`
              : "Upload failed",
          );
        }
      })();

      const noun = queued.length > 1 ? `${queued.length} files` : queued[0].item.name;
      toast.promise(run, {
        loading: `Uploading ${noun}…`,
        success: queued.length > 1 ? `Uploaded ${queued.length} files` : "Uploaded",
        error: (e: Error) => e.message,
      });
      await run.catch(() => {});
    },
    [onComplete],
  );

  return { items, uploadFiles, clear };
}
