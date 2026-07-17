import styles from './index.module.css';
import type { APIFile, File } from "../../data/dir";
import { Top } from "../top";
import { useEffect, useRef, useState } from 'react';

export interface ViewProps {
	file: File;
}

function Image(props: File) {
	// eslint-disable-next-line @next/next/no-img-element
	return <img alt='preview' className={styles.img} src={props.url} />
}

function Video(props: File) {
	return <video controls autoPlay className={styles.video} src={props.url} />
}

function Text(props: File) {
	const [content, setContent] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let active = true;
		fetch(props.url)
			.then((r) => r.text())
			.then((t) => { if (active) setContent(t); })
			.catch(() => { if (active) setFailed(true); });
		return () => { active = false; };
	}, [props.url]);

	if (failed) return <p>Could not load this file.</p>;
	if (content === null) return <p>Loading…</p>;
	return <pre className={styles.text}>{content}</pre>;
}

const playbackSpeeds = ['0.5', '0.75', '1', '1.25', '1.5', '2'];
function Audio(props: File) {

	const [playbackSpeed, setPlaybackSpeed] = useState<string>('1');
	const ref = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.playbackRate = parseFloat(playbackSpeed);
		}
	}, [playbackSpeed]);

	return <div>
		<span>Playback Speed</span>
		<div className={styles.playbackSpeeds}>
			{playbackSpeeds.map(speed => <button className={speed === playbackSpeed ? styles.playbackSpeedActive : ""} key={speed} onClick={() => setPlaybackSpeed(speed)}>{speed}</button>)}
		</div>
		<audio ref={ref} autoPlay controls src={props.url} className={styles.audio} />
	</div>
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
	switch (file.name.split('.').pop()?.toLowerCase()) {
		case 'jpeg':
		case 'jpg':
		case 'png':
		case 'webp':
			return Image;
		case 'pdf':
			return PDF;
		case 'mp4':
		case 'mov':
			return Video;
		case 'mp3':
		case 'mpeg':
		case 'wav':
		case 'aac':
		case 'm4a':
			return Audio;
		case 'txt':
			return Text;
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
			<div className={styles.buttons}>
				<a className={styles.button} target='_blank' download href={file.downloadUrl ?? file.url} rel="noreferrer">Download</a>
			</div>
			<Preview {...file} />
		</div>
	</div>
}