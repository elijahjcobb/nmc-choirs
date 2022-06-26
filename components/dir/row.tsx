import { FOLDER_MIME, GoogleDriveFile } from '../../data/drive';
import styles from './index.module.css';
import { FaFolder, FaQuestion, FaFileImage, FaFileAudio, FaFilePdf, FaFileVideo } from 'react-icons/fa';
import { IconType } from 'react-icons/lib';
import Link from 'next/link';

export interface RowProps {
	file: GoogleDriveFile;
	index: number;
}

function iconForType(type: string): IconType {
	switch (type) {
		case FOLDER_MIME:
			return FaFolder;
		case 'image/jpeg':
		case 'image/jpg':
		case 'image/png':
			return FaFileImage;
		case 'application/pdf':
			return FaFilePdf;
		case 'video/mp4':
			return FaFileVideo;
		case 'audio/mp3':
		case 'audio/mpeg':
			return FaFileAudio;
		default:
			return FaQuestion;
	}
}

export function Row({ file, index }: RowProps) {
	const Icon = iconForType(file.mimeType);
	return <Link href={`/${file.mimeType === FOLDER_MIME ? "" : "view/"}${file.id}`}>
		<li className={styles.row} style={{ animationDelay: index * 50 + "ms" }}>
			<Icon size={32} className={styles.icon} />
			<span className={styles.rowText}>{file.previewName}</span>
		</li>
	</Link>
}