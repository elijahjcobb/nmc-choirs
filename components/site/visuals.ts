// Icon + color-tile + label mapping for nodes, matching the design's per-type
// treatment (audio green, pdf amber, txt gray, md blue; folders share the green).
import type { FileKind, PublicExtension, TreeNode } from "@/lib/tree-types";
import { kindOf } from "@/lib/paths";
import type { IconName } from "./icons";

export interface Visual {
  icon: IconName;
  /** Tailwind bg+text classes for the color tile. */
  tile: string;
  typeLabel: string;
}

const KIND_ICON: Record<FileKind, IconName> = {
  audio: "music_note",
  pdf: "picture_as_pdf",
  text: "text_snippet",
  markdown: "article",
};

const KIND_TILE: Record<FileKind | "folder", string> = {
  folder: "bg-tile-audio-bg text-tile-audio-fg",
  audio: "bg-tile-audio-bg text-tile-audio-fg",
  pdf: "bg-tile-pdf-bg text-tile-pdf-fg",
  text: "bg-tile-txt-bg text-tile-txt-fg",
  markdown: "bg-tile-md-bg text-tile-md-fg",
};

function typeLabel(kind: FileKind, ext: PublicExtension): string {
  switch (kind) {
    case "audio":
      return `${ext.toUpperCase()} audio`;
    case "pdf":
      return "PDF document";
    case "text":
      return "Plain text";
    case "markdown":
      return "Markdown";
  }
}

export const FOLDER_VISUAL: Visual = {
  icon: "folder",
  tile: KIND_TILE.folder,
  typeLabel: "Folder",
};

export function visualFor(node: TreeNode): Visual {
  if (node.type === "folder") return FOLDER_VISUAL;
  const kind = kindOf(node.ext);
  return { icon: KIND_ICON[kind], tile: KIND_TILE[kind], typeLabel: typeLabel(kind, node.ext) };
}
