import type { GetStaticProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { getItemForPath } from "../data/dir";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getStaticProps: GetStaticProps<DirProps> = async () => {
	const items = await getItemForPath([]);
	return {
		props: {
			items,
		},
		revalidate: 60
	}
}