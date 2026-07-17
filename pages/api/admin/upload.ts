import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { ROOT } from "@/lib/blob";
import { validateEntryName, isAllowedFile } from "@/lib/files";

// The file bytes go from the browser straight to Blob; this route only issues
// the short-lived client token (small JSON), so the default body parser is fine.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdminRequest(req)) throw new Error("Unauthorized");
        if (!pathname.startsWith(ROOT)) throw new Error("Invalid path.");
        const segments = pathname.slice(ROOT.length).split("/");
        if (segments.some((s) => s.length === 0)) throw new Error("Invalid path.");
        const base = segments[segments.length - 1];
        for (const seg of segments.slice(0, -1)) {
          if (validateEntryName(seg)) throw new Error("Invalid folder name.");
        }
        if (validateEntryName(base) || !isAllowedFile(base)) {
          throw new Error("File type not allowed.");
        }
        return {
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 3600,
          maximumSizeInBytes: 1024 * 1024 * 1024,
        };
      },
      // Never fires on localhost (Blob can't reach the dev server); the client
      // refreshes and revalidates after the upload batch instead.
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
}
