import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminRequest } from "./admin-auth";
import { encodePathForRoute } from "./files";

/** Returns true if the request is an authenticated admin; otherwise responds 401. */
export function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  method: "GET" | "POST",
): boolean {
  if (req.method !== method) {
    res.setHeader("Allow", method);
    res.status(405).end();
    return false;
  }
  return true;
}

/** Best-effort on-demand revalidation of a public route by path segments. */
export async function revalidate(res: NextApiResponse, segments: string[]): Promise<void> {
  try {
    await res.revalidate(encodePathForRoute(segments));
  } catch {
    // ISR fallback (5 min) will catch up; never fail the mutation on this.
  }
}
