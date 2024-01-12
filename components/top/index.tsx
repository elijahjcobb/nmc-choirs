import { useRouter } from "next/router";
import { NavBar } from "../nav";
import { useMemo } from "react";
import { truncate } from "lodash";
import Link from "next/link";
import styles from "./index.module.css";
import { FaHome } from "react-icons/fa";

export function Top(): JSX.Element {

	const router = useRouter();

	const crumbs = useMemo(() =>
		router.asPath.split('/').filter(p => p !== 'view').splice(1).map((s, i, a) => {
			const name = decodeURIComponent(s);
			return { name: truncate(name, { length: i == a.length - 1 ? 32 : 16 }), fullName: name, href: `/${a.slice(0, i + 1).join("/")}` };
		})
		, [router.asPath]);

	return <div className={styles.top}>
		<NavBar />
		<div className={styles.name}>
			<Link href='/'>
				<FaHome className={styles.crumb} size={32} />
			</Link>
			{crumbs.map((c) => <Link key={c.name} title={c.fullName} href={c.href}><span className={styles.crumb}>{c.name}</span></Link>)}
		</div>
	</div>
}