import { GetStaticProps, GetStaticPaths } from "next";
import Media, { ViewProps } from "../../components/view";
import { fetchAllFiles, fetchFile } from "../../data/drive";


export default function Page(props: ViewProps) {
	return <Media {...props} />
}

export const getStaticProps: GetStaticProps<ViewProps> = async (context) => {
	const id = context.params?.id as string | undefined;
	if (!id) throw new Error("No id");
	const file = await fetchFile(id);
	return {
		props: {
			file
		}
	}
}

export const getStaticPaths: GetStaticPaths = async () => {
	const files = await fetchAllFiles();
	console.log(files);
	return {
		paths: files.map(id => ({ params: { id } })),
		fallback: false
	}
}