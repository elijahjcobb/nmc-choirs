import type { GetServerSideProps } from "next";
import { Dir, type DirProps } from "../components/dir";
import { getItemForPath } from "../data/dir";


export default function Page(props: DirProps) {
	return <Dir {...props} />
}

export const getServerSideProps: GetServerSideProps<DirProps> = async () => {
	const items = await getItemForPath([]);
	return {
		props: {
			items,
		},
	}
}