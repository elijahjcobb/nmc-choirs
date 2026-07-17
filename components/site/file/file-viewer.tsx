// Type-specific preview. The real audio player, PDF viewer, and text/markdown
// renderers are wired in later steps; this placeholder keeps the file page whole
// until then.
import { kindOf } from "@/lib/paths";
import type { TreeFileNode } from "@/lib/tree-types";

const LABELS: Record<string, string> = {
  audio: "Audio player",
  pdf: "Score viewer",
  text: "Text preview",
  markdown: "Notes",
};

export function FileViewer({ file }: { file: TreeFileNode; path: string[] }) {
  const kind = kindOf(file.ext);
  return (
    <div className="rounded-[18px] border border-line bg-surface p-6 text-center text-sm text-subtle">
      {LABELS[kind]} loads here.
    </div>
  );
}
