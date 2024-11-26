import { Icon } from "../icon";
import styles from "./index.module.css";
import { IoMdHelpCircle } from "react-icons/io";
import Link from "next/link";

export function NavBar({ title = "NMC Music" }: { title?: string }) {
	const fixedTitle = title.length > 18 ? title.slice(0, 15) + "..." : title;
	return <nav className={styles.nav}>
		<Link href='/'>
			<div className={styles.left}>
				<Icon width={18} />
				<h1>{fixedTitle}</h1>
			</div>
		</Link>
	</nav>
}