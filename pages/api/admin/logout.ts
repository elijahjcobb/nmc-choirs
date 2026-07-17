import type { NextApiRequest, NextApiResponse } from "next";
import { clearCookie } from "@/lib/admin-auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  res.setHeader("Set-Cookie", clearCookie());
  return res.status(204).end();
}
