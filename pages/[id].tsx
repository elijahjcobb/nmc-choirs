import type { GetServerSideProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { fetchFile, fetchFilesInDirectory } from "../data/drive";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getServerSideProps: GetServerSideProps<DirProps> = async (context) => {
	const id = context.query.id as string;
	return {
		props: {
			directory: await fetchFilesInDirectory(id),
			name: (await fetchFile(id)).name
		}
	}
}