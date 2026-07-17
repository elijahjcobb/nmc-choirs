// Type-specific preview. Audio is fully wired here; the PDF viewer and
// text/markdown renderers arrive in the next step.
import { kindOf } from "@/lib/paths";
import type { TreeFileNode } from "@/lib/tree-types";
import { AudioPlayer } from "../player/audio-player";

export function FileViewer({ file, path }: { file: TreeFileNode; path: string[] }) {
  const kind = kindOf(file.ext);

  if (kind === "audio") return <AudioPlayer file={file} path={path} />;

  const label =
    kind === "pdf" ? "Score viewer" : kind === "markdown" ? "Notes" : "Text preview";
  return (
    <div className="rounded-[18px] border border-line bg-surface p-6 text-center text-sm text-subtle">
      {label} loads here.
    </div>
  );
}
