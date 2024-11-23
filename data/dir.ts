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
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error(`Failed to load API request: ${e}`);
    throw e;
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch (e) {
    console.error(`Failed to parse json ${e}`);
    throw e;
  }

  return apiSchema.parse(json);
}
