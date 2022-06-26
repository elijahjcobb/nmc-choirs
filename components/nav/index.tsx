import { Icon } from "../icon";
import styles from "./index.module.css";
import { IoMdHelpCircle } from "react-icons/io";
import { FaHome } from "react-icons/fa";
import Link from "next/link";

export function NavBar({ title = "NMC Music" }: { title?: string }) {
	const fixedTitle = title.length > 18 ? title.slice(0, 15) + "..." : title;
	return <nav className={styles.nav}>
		<div>
			<Icon width={18} />
			<h1>{fixedTitle}</h1>
		</div>
		<div>
			<Link href={'/'}>
				<FaHome size={32} />
			</Link>
			<Link href={'/about'}>
				<IoMdHelpCircle size={32} />
			</Link>
		</div>
	</nav>
}