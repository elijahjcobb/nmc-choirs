import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { verifyPassword, mintToken, sessionCookie } from "@/lib/admin-auth";

const bodySchema = z.object({ password: z.string() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });
  if (!verifyPassword(parsed.data.password)) {
    // Cheap throttle against guessing.
    await new Promise((r) => setTimeout(r, 300));
    return res.status(401).json({ error: "Incorrect password." });
  }
  res.setHeader("Set-Cookie", sessionCookie(mintToken()));
  return res.status(204).end();
}
