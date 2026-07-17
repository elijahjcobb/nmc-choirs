import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdmin, requireMethod, revalidate } from "@/lib/admin-api";
import { deleteEntry } from "@/lib/blob";

const bodySchema = z.object({
  path: z.array(z.string()).min(1),
  type: z.enum(["file", "directory"]),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "POST")) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });
  const { path, type } = parsed.data;

  const deleted = await deleteEntry(path, type);

  await revalidate(res, path.slice(0, -1));
  if (type === "file") await revalidate(res, ["view", ...path]);

  return res.status(200).json({ deleted });
}
