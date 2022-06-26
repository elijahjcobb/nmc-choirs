const API_KEY = process.env.API_KEY as string;
const FOLDER_ID = process.env.FOLDER_ID as string;
export const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface RawGoogleDriveFile {
	kind: string;
	id: string;
	name: string;
	mimeType: string;
}

export interface GoogleDriveFile {
	kind: string;
	id: string;
	name: string;
	mimeType: string;
	previewName: string;
	url: string;
}

export type GoogleDriveChild = GoogleDriveFile | GoogleDriveDirectory;

export interface GoogleDriveDirectory {
	name: string;
	kind: 'dir';
	children: GoogleDriveChild[];
}

function convertRawFile(file: RawGoogleDriveFile): GoogleDriveFile {
	const lastSep = file.name.lastIndexOf('.');
	const name = lastSep > 0 ? file.name.substring(0, lastSep) : file.name;
	return {
		...file,
		previewName: name,
		url: generateDownloadURLForFile(file.id)
	};
}

export async function fetchFile(id: string): Promise<GoogleDriveFile> {
	const url = `https://www.googleapis.com/drive/v3/files/${id}?key=${API_KEY}`;
	const response = await fetch(url);
	const file = await response.json() as RawGoogleDriveFile;
	return convertRawFile(file)
}

export async function fetchFilesInDirectory(folderId: string = FOLDER_ID): Promise<GoogleDriveFile[]> {
	const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${API_KEY}`;
	const response = await fetch(url);
	const json = await response.json();
	let files = json.files as (RawGoogleDriveFile[]) | undefined;
	if (!files) throw new Error("Could not fetch files.");
	const fixedFiles = files.map(file => convertRawFile(file))
	return fixedFiles.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchDirectoryRecursive(folderId: string = FOLDER_ID, name: string = '/'): Promise<GoogleDriveDirectory> {
	console.log({folderId})
	const files = await fetchFilesInDirectory(folderId);
	console.log({files})
	const children: GoogleDriveChild[] = [];
	for (const file of files) {
		if (file.mimeType === FOLDER_MIME) {
			children.push(await fetchDirectoryRecursive(file.id, file.name));
		} else {
			children.push(file)
		}
	}
	return {
		name,
		kind: 'dir',
		children
	}
}

export async function fetchDirectoryTree(): Promise<GoogleDriveDirectory> {
	return await fetchDirectoryRecursive();
}

export function generateDownloadURLForFile(fileId: string): string {
	return `https://drive.google.com/uc?export=download&id=${fileId}`;
}