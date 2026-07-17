import type { EntryType } from "@/lib/admin-types";

/** POSTs JSON and throws an Error(message) on any non-OK response. */
async function post(url: string, body: unknown): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error.");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Something went wrong.");
  }
}

export const createFolder = (path: string[]) => post("/api/admin/mkdir", { path });

export const moveEntry = (from: string[], to: string[], type: EntryType) =>
  post("/api/admin/move", { from, to, type });

export const deleteEntry = (path: string[], type: EntryType) =>
  post("/api/admin/delete", { path, type });

export const saveOrder = (dir: string[], names: string[]) =>
  post("/api/admin/order", { dir, names });

/** Best-effort revalidation of a public route; never throws. */
export async function revalidatePath(path: string[]): Promise<void> {
  try {
    await post("/api/admin/revalidate", { path });
  } catch {
    /* ISR fallback will catch up */
  }
}
