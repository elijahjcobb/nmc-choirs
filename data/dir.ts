// Public data-layer facade. The file/folder tree is served from Vercel Blob
// (see lib/blob.ts); these types and getItemForPath keep the same shape the
// public pages and components have always consumed.
import { listDir } from "../lib/blob";

export interface APIFile {
  name: string;
  mtime: string;
  type: "file";
  size: number;
}

export interface APIDirectory {
  name: string;
  mtime: string;
  type: "directory";
}

export type APIItem = APIFile | APIDirectory;

export type File = APIFile & { url: string; downloadUrl?: string };

export async function getItemForPath(path: string[]): Promise<APIItem[]> {
  return listDir(path);
}
