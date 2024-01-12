import styles from './index.module.css';
import type { APIFile, File } from "../../data/dir";
import { Top } from "../top";

export interface ViewProps {
	file: File;
}

function Image(props: File) {
	// eslint-disable-next-line @next/next/no-img-element
	return <img alt='preview' className={styles.img} src={props.url} />
}

function Video(props: File) {
	return <video controls autoPlay className={styles.video}>
		<source src={props.url} type={'video/mp4'} />
	</video>
}

function Audio(props: File) {
	return <audio autoPlay controls className={styles.audio}>
		<source src={props.url} type={`audio/${props.name.split(".").pop()}`} />
	</audio>
}

function PDF(props: File) {
	return <iframe
		src={props.url}
		frameBorder="0"
		allow='autoplay'
		scrolling="auto"
		className={styles.pdf}
	/>
}

function ErrorMessage(props: File) {
	return <p>Error</p>
}

function elementForType(file: APIFile) {
	switch (file.name.split('.').pop()) {
		case 'jpeg':
		case 'jpg':
		case 'png':
			return Image;
		case 'pdf':
			return PDF;
		case 'mp4':
			return Video;
		case 'mp3':
		case 'mpeg':
			return Audio;
		default:
			return ErrorMessage;
	}
}


export default function Media({ file }: ViewProps) {
	const Preview = elementForType(file);
	return <div>
		<Top />
		<div className={styles.container}>
			<h1>{file.name.split(".")[0]}</h1>
			<Preview {...file} />
		</div>
	</div>
}