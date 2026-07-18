import type { NextApiRequest, NextApiResponse } from "next";
import type { ListBlobResultBlob } from "@vercel/blob";
import { requireAdmin, requireMethod } from "@/lib/admin-api";
import { listSubtree, fetchOrder, ROOT, ORDER } from "@/lib/blob";
import { isHiddenName } from "@/lib/files";
import type { TreeResponse, TreeFile } from "@/lib/admin-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  if (!requireMethod(req, res, "GET")) return;

  const blobs = await listSubtree(ROOT);
  const files: TreeFile[] = [];
  const folderKeys = new Set<string>();
  const orderBlobs: { key: string; blob: ListBlobResultBlob }[] = [];

  for (const blob of blobs) {
    const rel = blob.pathname.slice(ROOT.length);
    if (rel.length === 0) continue;
    const segments = rel.split("/");
    // Register every ancestor directory (covers empty folders via `.keep`).
    for (let i = 1; i < segments.length; i++) {
      folderKeys.add(JSON.stringify(segments.slice(0, i)));
    }
    const base = segments[segments.length - 1];
    if (isHiddenName(base)) {
      // Order file's directory key mirrors the client's pathKey (root = "").
      if (base === ORDER) orderBlobs.push({ key: segments.slice(0, -1).join("/"), blob });
      continue;
    }
    files.push({
      path: segments,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
  }

  const orders: Record<string, string[]> = {};
  await Promise.all(
    orderBlobs.map(async ({ key, blob }) => {
      const parsed = await fetchOrder(blob);
      if (parsed) orders[key] = parsed;
    }),
  );

  const folders = Array.from(folderKeys, (s) => JSON.parse(s) as string[]);
  const body: TreeResponse = { files, folders, orders };
  res.status(200).json(body);
}
