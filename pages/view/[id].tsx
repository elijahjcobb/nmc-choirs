import { GetServerSideProps } from "next";
import Media, { ViewProps } from "../../components/view";
import { fetchFile } from "../../data/drive";


export default function Page(props: ViewProps) {
	return <Media {...props} />
}

export const getServerSideProps: GetServerSideProps<ViewProps> = async (context) => {
	const id = context.query.id as string;
	const file = await fetchFile(id);
	return {
		props: {
			file
		}
	}
}