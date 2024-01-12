import styles from './index.module.css';
import { FaFolder, FaQuestion, FaFileImage, FaFileAudio, FaFilePdf, FaFileVideo, FaFileWord } from 'react-icons/fa';
import { IconType } from 'react-icons/lib';
import Link from 'next/link';
import { useRouter } from 'next/router'
import { useMemo } from 'react';
import { APIItem } from '../../data/dir';

export interface RowProps {
	item: APIItem;
	index: number;
}

function iconForType(item: APIItem): IconType {
	if (item.type === 'directory') return FaFolder;
	const extension = item.name.split('.').pop();
	switch (extension) {
		case 'jpeg':
		case 'jpg':
		case 'png':
			return FaFileImage;
		case 'pdf':
			return FaFilePdf;
		case 'mp4':
			return FaFileVideo;
		case 'mp3':
		case 'aac':
		case 'wav':
		case 'mpeg':
			return FaFileAudio;
		case 'txt':
			return FaFileWord;
		default:
			return FaQuestion;
	}
}

export function Row({ item, index }: RowProps) {
	const Icon = iconForType(item);

	const router = useRouter();

	const href = useMemo(() => {
		return `${item.type === 'file' ? "/view" : ""}${router.asPath}/${item.name}`
	}, [item.name, item.type, router.asPath])

	return <Link href={href}>
		<li className={styles.row} style={{ animationDelay: index * 50 + "ms" }}>
			<Icon size={32} className={styles.icon} />
			<span className={styles.rowText}>{item.name}</span>
		</li>
	</Link>
}