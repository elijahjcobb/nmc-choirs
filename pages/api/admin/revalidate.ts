import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdmin, requireMethod, revalidate } from "@/lib/admin-api";

const bodySchema = z.object({ path: z.array(z.string()) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "POST")) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });

  await revalidate(res, parsed.data.path);
  return res.status(200).json({ ok: true });
}
