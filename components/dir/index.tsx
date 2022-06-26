import { GoogleDriveFile } from "../../data/drive";
import { NavBar } from "../nav";
import styles from './index.module.css';
import { Row } from "./row";

export interface DirProps {
	directory: GoogleDriveFile[];
	name: string;
}

export function Dir({ directory, name }: DirProps) {

	return <div className={styles.container}>
		<div className={styles.top}>
			<NavBar />
			<h2 className={styles.folderName}>{name}</h2>
		</div>
		<div className={styles.listContainer}>
			{directory.length === 0 && <span>{'You found an empty folder :)'}</span>}
			<ul className={styles.list}>
				{directory.map((file, i) => <>
					<Row index={i} file={file} key={file.id} />
					{i < directory.length - 1 && <div key={'line' + i} className={styles.sep} />}
				</>)}
			</ul>
		</div>
	</div>
}