// Type-specific preview: audio player, pdf.js score viewer, or text/markdown.
import dynamic from "next/dynamic";
import { kindOf } from "@/lib/paths";
import type { TreeFileNode } from "@/lib/tree-types";
import { AudioPlayer } from "../player/audio-player";
import { TextViewer } from "../text/text-viewer";

const PdfViewer = dynamic(() => import("../pdf/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full animate-pulse rounded-[18px] bg-line"
      style={{ aspectRatio: "1 / 1.1" }}
    />
  ),
});

export function FileViewer({ file, path }: { file: TreeFileNode; path: string[] }) {
  const kind = kindOf(file.ext);
  if (kind === "audio") return <AudioPlayer file={file} path={path} />;
  if (kind === "pdf") return <PdfViewer file={file} path={path} />;
  return <TextViewer file={file} path={path} />;
}
