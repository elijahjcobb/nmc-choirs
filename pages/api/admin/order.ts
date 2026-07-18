import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdmin, requireMethod, revalidate } from "@/lib/admin-api";
import { writeOrder, dirExists } from "@/lib/blob";
import { validateEntryName } from "@/lib/files";

const bodySchema = z.object({
  dir: z.array(z.string()), // [] = store root -> files/.order.json
  names: z.array(z.string()).max(5000),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "POST")) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });
  const { dir, names } = parsed.data;

  // Dir segments form the blob path — reject anything invalid (blocks traversal).
  for (const seg of dir) {
    const err = validateEntryName(seg);
    if (err) return res.status(400).json({ error: err });
  }

  if (dir.length > 0 && !(await dirExists(dir))) {
    return res.status(404).json({ error: "That folder no longer exists." });
  }

  // Filter (don't reject) invalid names and dedupe: a legacy file with an odd
  // character must never brick reordering; dropped names fall to the alpha tail.
  const seen = new Set<string>();
  const clean = names.filter((name) => {
    if (validateEntryName(name) !== null || seen.has(name)) return false;
    seen.add(name);
    return true;
  });

  await writeOrder(dir, clean);
  await revalidate(res, dir);
  return res.status(200).json({ ok: true });
}
