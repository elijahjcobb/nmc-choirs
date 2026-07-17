import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdmin, requireMethod, revalidate } from "@/lib/admin-api";
import { mkdir, dirExists, fileExists } from "@/lib/blob";
import { validateEntryName } from "@/lib/files";

const bodySchema = z.object({ path: z.array(z.string()).min(1) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "POST")) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });
  const { path } = parsed.data;

  for (const seg of path) {
    const err = validateEntryName(seg);
    if (err) return res.status(400).json({ error: err });
  }

  // Detect a collision with an existing folder (even an empty one) or file.
  if ((await dirExists(path)) || (await fileExists(path))) {
    return res.status(409).json({ error: "An item with that name already exists." });
  }

  await mkdir(path);
  await revalidate(res, path.slice(0, -1));
  return res.status(201).json({ ok: true });
}
