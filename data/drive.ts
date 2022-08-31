const API_KEY = process.env.API_KEY as string;
const FOLDER_ID = process.env.FOLDER_ID as string;
export const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface RawGoogleDriveFile {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
}
export interface GoogleDriveFile extends RawGoogleDriveFile {
  previewName: string;
  url: string;
}

function convertRawFile(file: RawGoogleDriveFile): GoogleDriveFile | undefined {
  if (!file.name) return undefined;
  const lastSep = file.name.lastIndexOf(".");
  const name = lastSep > 0 ? file.name.substring(0, lastSep) : file.name;
  return {
    ...file,
    previewName: name,
    url: generateDownloadURLForFile(file.id),
  };
}

export async function fetchFile(
  id: string
): Promise<GoogleDriveFile | undefined> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?key=${API_KEY}`;
  const response = await fetch(url);
  const file = (await response.json()) as RawGoogleDriveFile;
  return convertRawFile(file);
}

export async function fetchFilesInDirectory(
  folderId: string = FOLDER_ID
): Promise<GoogleDriveFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${API_KEY}`;
  const response = await fetch(url);
  const json = await response.json();
  let files = json.files as RawGoogleDriveFile[] | undefined;
  if (!files) return [];
  let fixedFiles: GoogleDriveFile[] = [];
  for (const file of files) {
    const fixed = convertRawFile(file);
    if (file && fixed) fixedFiles.push(fixed);
  }
  return fixedFiles.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchDirectoriesRecursive(
  directories: string[],
  folderId: string
): Promise<void> {
  directories.push(folderId);
  const files = await fetchFilesInDirectory(folderId);
  for (const file of files) {
    if (file.mimeType !== FOLDER_MIME) continue;
    await fetchDirectoriesRecursive(directories, file.id);
  }
}

async function fetchFilesRecursive(
  filesIds: string[],
  folderId: string
): Promise<void> {
  const files = await fetchFilesInDirectory(folderId);
  for (const file of files) {
    if (file.mimeType !== FOLDER_MIME) filesIds.push(file.id);
    else await fetchFilesRecursive(filesIds, file.id);
  }
}

export async function fetchAllDirectories(): Promise<string[]> {
  const directories: string[] = [];
  await fetchDirectoriesRecursive(directories, FOLDER_ID);
  return directories;
}

export async function fetchAllFiles(): Promise<string[]> {
  const files: string[] = [];
  await fetchFilesRecursive(files, FOLDER_ID);
  return files;
}

export function generateDownloadURLForFile(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
