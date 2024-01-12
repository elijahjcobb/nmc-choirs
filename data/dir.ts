import { z } from "zod";
import { API_URL } from "./constants";

const baseSchema = z.object({
  name: z.string(),
  mtime: z.string(),
});

const fileSchema = baseSchema.extend({
  type: z.literal("file"),
  size: z.number(),
});

const directorySchema = baseSchema.extend({
  type: z.literal("directory"),
});

const apiSchema = z.array(z.union([fileSchema, directorySchema]));

export type APIFile = z.infer<typeof fileSchema>;
export type APIDirectory = z.infer<typeof directorySchema>;
export type APIItem = APIFile | APIDirectory;

export type File = APIFile & { url: string };

export async function getItemForPath(path: string[]): Promise<APIItem[]> {
  const url = `${API_URL}/${path.join("/")}`;
  const res = await fetch(url);
  const json = await res.json();
  return apiSchema.parse(json);
}
