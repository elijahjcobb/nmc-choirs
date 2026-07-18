// File detail screen: a sticky top bar (back / breadcrumbs), header (icon tile +
// title), Download / Share actions, and the type-specific viewer.
import { useState } from "react";
import { useSite } from "../site-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { Icon } from "../icons";
import { visualFor } from "../visuals";
import { FileViewer } from "./file-viewer";
import { ShareMenu } from "../browse/share-menu";
import type { TreeFileNode } from "@/lib/tree-types";
import { displayName, kindOf } from "@/lib/paths";

export function FilePage({
  file,
  path,
}: {
  file: TreeFileNode;
  path: string[];
}) {
  const { navigate } = useSite();
  const visual = visualFor(file);
  const [shareOpen, setShareOpen] = useState(false);
  const parentPath = path.slice(0, -1);
  const context = ["Home", ...parentPath].join(" / ");
  // Scores get a wider column than audio/text.
  const maxW = kindOf(file.ext) === "pdf" ? "max-w-[1100px]" : "max-w-[820px]";

  return (
    <div className={`mx-auto w-full ${maxW}`}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 bg-canvas/85 px-[clamp(16px,3vw,32px)] pb-3 backdrop-blur-sm"
        style={{ paddingTop: "calc(clamp(16px,3vw,32px) + env(safe-area-inset-top))" }}
      >
        {/* Mobile: back button + context */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() =>
              navigate(parentPath.length ? `/${parentPath.map(encodeURIComponent).join("/")}` : "/")
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
            aria-label="Back"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <div className="truncate text-[12.5px] text-subtle">{context}</div>
        </div>
        {/* Desktop: breadcrumbs with the file as the trailing crumb */}
        <div className="hidden md:block">
          <Breadcrumbs trailingLabel={displayName(file)} />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-[clamp(16px,3vw,32px)] pb-[clamp(16px,3vw,32px)]">
        <div className="flex items-center gap-[18px]">
          <span
            className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[20px] ${visual.tile}`}
          >
            <Icon name={visual.icon} size={40} filled />
          </span>
          <h1 className="min-w-0 flex-1 text-[clamp(20px,2.6vw,26px)] font-bold leading-[1.25] tracking-[-0.01em] text-ink text-pretty">
            {displayName(file)}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={file.downloadUrl}
            download
            className="flex items-center justify-center gap-2 rounded-[13px] bg-brand px-6 py-3 text-[14.5px] font-semibold text-brand-ink transition-opacity hover:opacity-90"
          >
            <Icon name="download" size={20} />
            Download
          </a>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-line-strong px-6 py-3 text-[14.5px] font-semibold text-ink transition-colors hover:border-brand"
          >
            <Icon name="share" size={19} />
            Share
          </button>
        </div>

        <FileViewer file={file} path={path} />
      </div>

      {shareOpen && (
        <ShareMenu node={file} path={path} open={shareOpen} onOpenChange={setShareOpen} />
      )}
    </div>
  );
}
