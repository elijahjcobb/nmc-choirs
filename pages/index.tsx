import type { GetStaticProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { REVALIDATE_TIME } from "../data/constants";
import { fetchFilesInDirectory } from "../data/drive";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getStaticProps: GetStaticProps<DirProps> = async () => {
	return {
		props: {
			directory: await fetchFilesInDirectory(),
			name: "Home"
		},
		revalidate: REVALIDATE_TIME,
	}
}