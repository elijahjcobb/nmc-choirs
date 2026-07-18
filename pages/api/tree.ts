import type { NextApiRequest, NextApiResponse } from "next";
import { buildLibraryIndex } from "@/lib/tree";
import type { LibraryIndex } from "@/lib/tree-types";

/**
 * Public library index. The whole tree (<300 files) ships in one response so the
 * client can browse/search/queue with no further round-trips. Cached at the CDN
 * with a short s-maxage + generous stale-while-revalidate for instant launches.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LibraryIndex | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }
  try {
    const index = await buildLibraryIndex();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=300",
    );
    res.status(200).json(index);
  } catch {
    res.status(500).json({ error: "Failed to build library index" });
  }
}
