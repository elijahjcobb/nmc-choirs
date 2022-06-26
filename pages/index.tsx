import type { GetServerSideProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { fetchFilesInDirectory } from "../data/drive";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getServerSideProps: GetServerSideProps<DirProps> = async (context) => {
	return {
		props: {
			directory: await fetchFilesInDirectory(),
			name: "Home"
		}
	}
}