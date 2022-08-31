import type { GetStaticPaths, GetStaticProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { FALLBACK_MODE, REVALIDATE_TIME } from "../data/constants";
import { fetchAllDirectories, fetchFile, fetchFilesInDirectory } from "../data/drive";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getStaticProps: GetStaticProps<DirProps> = async (context) => {
	const id = context.params?.id as string | undefined;
	if (!id) throw new Error("No id");
	const file = await fetchFile(id);
	const name = file ? file.name : "";
	return {
		props: {
			directory: await fetchFilesInDirectory(id),
			name,
		},
		revalidate: REVALIDATE_TIME
	}
}

export const getStaticPaths: GetStaticPaths = async () => {
	const paths = await fetchAllDirectories();
	return {
		paths: paths.map(id => ({ params: { id } })),
		fallback: FALLBACK_MODE
	}
}