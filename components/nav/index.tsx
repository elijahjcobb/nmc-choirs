import { Icon } from "../icon";
import styles from "./index.module.css";
import { IoMdHelpCircle } from "react-icons/io";
import { FaHome } from "react-icons/fa";
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
		<div>
			<Link href='/'>
				<FaHome className={styles.btn} size={32} />
			</Link>
			<Link href='/about'>
				<IoMdHelpCircle className={styles.btn} size={32} />
			</Link>
		</div>
	</nav>
}