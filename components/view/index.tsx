import styles from './index.module.css';
import type { APIFile, File } from "../../data/dir";
import { Top } from "../top";
import { useEffect, useMemo, useRef, useState } from 'react';

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

const playbackSpeeds = ['0.5', '0.75', '1', '1.25', '1.5', '2'];
function Audio(props: File): JSX.Element {

	const [playbackSpeed, setPlaybackSpeed] = useState<string>('1');
	const ref = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.playbackRate = parseFloat(playbackSpeed);
		}
	}, [playbackSpeed]);

	const url = useMemo(() => encodeURI(props.url), [props.url]);
	return <div>
		<span>Playback Speed</span>
		<div className={styles.playbackSpeeds}>
			{playbackSpeeds.map(speed => <button className={speed === playbackSpeed ? styles.playbackSpeedActive : ""} key={speed} onClick={() => setPlaybackSpeed(speed)}>{speed}</button>)}
		</div>
		<audio ref={ref} autoPlay controls src={url} className={styles.audio} />
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
			<div className={styles.buttons}>
				<a className={styles.button} target='_blank' download href={file.url} rel="noreferrer">Download</a>
			</div>
			<Preview {...file} />
		</div>
	</div>
}