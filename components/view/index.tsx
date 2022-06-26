import { NavBar } from "../../components/nav";
import { type GoogleDriveFile } from "../../data/drive";
import styles from './index.module.css';

export interface ViewProps {
	file: GoogleDriveFile;
}

function Image(props: GoogleDriveFile) {
	// eslint-disable-next-line @next/next/no-img-element
	return <img alt='preview' className={styles.img} src={props.url} />
}

function Video(props: GoogleDriveFile) {
	return <video controls autoPlay className={styles.video}>
		<source src={props.url} type={props.mimeType} />
	</video>
}

function Audio(props: GoogleDriveFile) {
	return <audio autoPlay controls className={styles.audio}>
		<source src={props.url} type={props.mimeType} />
	</audio>
}

function PDF(props: GoogleDriveFile) {
	console.log(props);
	return <iframe
		src={`https://drive.google.com/file/d/${props.id}/preview`}
		frameBorder="0"
		allow='autoplay'
		scrolling="auto"
		className={styles.pdf}
	/>
}

function ErrorMessage(props: GoogleDriveFile) {
	return <p>Error</p>
}

function elementForType(type: string) {
	switch (type) {
		case 'image/jpeg':
		case 'image/jpg':
		case 'image/png':
			return Image;
		case 'application/pdf':
			return PDF;
		case 'video/mp4':
			return Video;
		case 'audio/mp3':
		case 'audio/mpeg':
			return Audio;
		default:
			return ErrorMessage;
	}
}


export default function Media({ file }: ViewProps) {
	const Preview = elementForType(file.mimeType);
	return <div>
		<NavBar title={file.previewName} />
		<div className={styles.container}>
			<Preview {...file} />
		</div>
	</div>
}