// The single public page. Every folder and file URL renders here; the client
// resolves the current path against the in-memory library index. Shallow
// routing means this component never remounts as the user navigates.
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { buildLibraryIndex } from "@/lib/tree";
import type { LibraryIndex } from "@/lib/tree-types";
import { useTree } from "@/hooks/use-tree";
import { useCurrentPath } from "@/hooks/use-shallow-nav";
import { displayName, hrefForPath } from "@/lib/paths";

interface PageProps {
  index: LibraryIndex;
}

export default function Page({ index }: PageProps) {
  const tree = useTree(index);
  const path = useCurrentPath();
  const node = tree.getNode(path);

  if (!node) {
    return <div style={{ padding: 24 }}>Not found</div>;
  }

  if (node.type === "folder") {
    return (
      <div style={{ padding: 24 }}>
        <h1>{path.length ? node.name : "Library"}</h1>
        <ul>
          {node.children.map((child) => (
            <li key={child.name}>
              <Link href={hrefForPath([...path, child.name])}>
                {child.type === "folder" ? "📁 " : "📄 "}
                {displayName(child)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{displayName(node)}</h1>
      <p>
        {node.ext.toUpperCase()} · <a href={node.downloadUrl}>Download</a>
      </p>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const index = await buildLibraryIndex();
  return { props: { index }, revalidate: 60 };
};
