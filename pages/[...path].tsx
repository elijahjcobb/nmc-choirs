import type { GetStaticPaths, GetStaticProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { getItemForPath } from "../data/dir";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: [],
		fallback: "blocking"
	}
}

export const getStaticProps: GetStaticProps<DirProps> = async (context) => {
	const path = context.params?.path as string[];
	const items = await getItemForPath(path);
	return {
		props: {
			items
		},
		revalidate: 60
	}
}
