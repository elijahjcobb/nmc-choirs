import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdmin, requireMethod, revalidate } from "@/lib/admin-api";
import { listDir, moveEntry, fileExists, dirExists, renameInOrder } from "@/lib/blob";
import { validateEntryName } from "@/lib/files";

const bodySchema = z.object({
  from: z.array(z.string()).min(1),
  to: z.array(z.string()).min(1),
  type: z.enum(["file", "directory"]),
});

/** True if `to` is `from` itself or a descendant of `from`. */
function isSelfOrDescendant(from: string[], to: string[]): boolean {
  return to.length >= from.length && from.every((seg, i) => to[i] === seg);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "POST")) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });
  const { from, to, type } = parsed.data;

  for (const seg of to) {
    const err = validateEntryName(seg);
    if (err) return res.status(400).json({ error: err });
  }

  if (type === "directory" && isSelfOrDescendant(from, to)) {
    return res.status(400).json({ error: "Cannot move a folder into itself." });
  }
  if (from.length === to.length && from.every((s, i) => s === to[i])) {
    return res.status(400).json({ error: "Source and destination are the same." });
  }

  const sourceExists = type === "file" ? await fileExists(from) : await dirExists(from);
  if (!sourceExists) return res.status(404).json({ error: "The item no longer exists." });

  const toParent = to.slice(0, -1);
  const toName = to[to.length - 1];
  const toSiblings = await listDir(toParent);
  if (toSiblings.some((i) => i.name === toName)) {
    return res.status(409).json({ error: "An item with that name already exists there." });
  }

  const moved = await moveEntry(from, to, type);

  const fromParent = from.slice(0, -1);
  // A same-directory file rename keeps its slot in the order file (best-effort).
  if (
    type === "file" &&
    fromParent.length === toParent.length &&
    fromParent.every((s, i) => s === toParent[i])
  ) {
    await renameInOrder(toParent, from[from.length - 1], toName);
  }

  await revalidate(res, fromParent);
  await revalidate(res, toParent);
  if (type === "file") {
    await revalidate(res, from);
    await revalidate(res, to);
  }

  return res.status(200).json({ moved });
}
