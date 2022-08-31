import { GetStaticProps, GetStaticPaths } from "next";
import Media, { ViewProps } from "../../components/view";
import { FALLBACK_MODE, REVALIDATE_TIME } from "../../data/constants";
import { fetchAllFiles, fetchFile, GoogleDriveFile } from "../../data/drive";


export default function Page(props: ViewProps) {
	return <Media {...props} />
}

export const getStaticProps: GetStaticProps<ViewProps> = async (context) => {
	const id = context.params?.id as string | undefined;
	if (!id) throw new Error("No id");
	const file = await fetchFile(id) as GoogleDriveFile;
	return {
		props: {
			file
		},
		revalidate: REVALIDATE_TIME
	}
}

export const getStaticPaths: GetStaticPaths = async () => {
	const files = await fetchAllFiles();
	return {
		paths: files.map(id => ({ params: { id } })),
		fallback: FALLBACK_MODE
	}
}