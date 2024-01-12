import type { GetServerSideProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { getItemForPath } from "../data/dir";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getServerSideProps: GetServerSideProps<DirProps> = async (context) => {
	const path = context.params?.path as string[];
	const items = await getItemForPath(path);
	return {
		props: {
			items
		},
	}
}
