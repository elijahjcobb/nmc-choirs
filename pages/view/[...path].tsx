import { GetServerSideProps } from "next";
import Media, { ViewProps } from "../../components/view";
import { getItemForPath } from "../../data/dir";
import { API_URL } from "../../data/constants";


export default function Page(props: ViewProps) {
	return <Media {...props} />
}

export const getServerSideProps: GetServerSideProps<ViewProps> = async (context) => {
	const path = context.params?.path as string[];
	const directoryPath = path.slice(0, path.length - 1);
	const fileName = path[path.length - 1];
	const items = await getItemForPath(directoryPath);
	const file = items.find((f) => f.name === fileName);
	if (!file) throw new Error('File not found');
	if (file.type !== 'file') throw new Error('File is a directory');
	return {
		props: {
			file: {
				...file,
				url: `${API_URL}/${path.join('/')}`
			}
		},
	}
}