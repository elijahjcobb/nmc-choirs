import { NavBar } from "../components/nav"
import styles from "../styles/about.module.css";

export default function Page() {
	return <div>
		<NavBar />
		<div className={styles.container}>
			<h1>About</h1>
			<p>{'Click the share button at the bottom of your screen and select "Add to Homescreen" to download this app.'}</p>
			<p>Contact <a href="mailto:jecobb@nmc.edu">jecobb@nmc.edu</a> for any support or questions.</p>
		</div>
	</div>
}
