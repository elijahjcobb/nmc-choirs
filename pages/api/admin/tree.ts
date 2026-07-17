import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin, requireMethod } from "@/lib/admin-api";
import { listSubtree, ROOT, KEEP } from "@/lib/blob";
import type { TreeResponse, TreeFile } from "@/lib/admin-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "GET")) return;

  const blobs = await listSubtree(ROOT);
  const files: TreeFile[] = [];
  const folderKeys = new Set<string>();

  for (const blob of blobs) {
    const rel = blob.pathname.slice(ROOT.length);
    if (rel.length === 0) continue;
    const segments = rel.split("/");
    // Register every ancestor directory (covers empty folders via `.keep`).
    for (let i = 1; i < segments.length; i++) {
      folderKeys.add(JSON.stringify(segments.slice(0, i)));
    }
    const base = segments[segments.length - 1];
    if (base === KEEP) continue;
    files.push({
      path: segments,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
  }

  const folders = Array.from(folderKeys, (s) => JSON.parse(s) as string[]);
  const body: TreeResponse = { files, folders };
  res.status(200).json(body);
}
