import type { GetStaticPaths, GetStaticProps } from "next";
import Media, { ViewProps } from "../../components/view";
import { getFile } from "../../lib/blob";


export default function Page(props: ViewProps) {
	return <Media {...props} />
}

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: [],
		fallback: "blocking"
	}
}

export const getStaticProps: GetStaticProps<ViewProps> = async (context) => {
	const path = (context.params?.path as string[]) ?? [];
	const file = await getFile(path);
	if (!file) return { notFound: true, revalidate: 300 };
	return {
		props: { file },
		revalidate: 300
	}
}
