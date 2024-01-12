import type { APIItem } from "../../data/dir";
import styles from './index.module.css';
import { Row } from "./row";
import { Top } from "../top";

export interface DirProps {
	items: APIItem[];
}

export function Dir({ items }: DirProps) {
	return <div className={styles.container}>
		<Top />
		<div className={styles.listContainer}>
			{items.length === 0 && <span>{'You found an empty folder :)'}</span>}
			<ul className={styles.list}>
				{items.map((file, i) => <div key={file.name}>
					<Row index={i} item={file} key={file.name} />
					{i < items.length - 1 && <div className={styles.sep} />}
				</div>)}
			</ul>
		</div>
	</div>
}