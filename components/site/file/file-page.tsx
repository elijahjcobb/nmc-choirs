// File detail screen: header (icon tile + title + chips), Download / Open
// original actions, and the type-specific viewer. The viewer + audio player are
// wired in later steps; a placeholder renders until then.
import { useSite } from "../site-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { Icon } from "../icons";
import { visualFor } from "../visuals";
import { Chips } from "./chips";
import { FileViewer } from "./file-viewer";
import type { TreeFileNode } from "@/lib/tree-types";
import { displayName, formatDate, formatSize } from "@/lib/paths";

export function FilePage({
  file,
  path,
}: {
  file: TreeFileNode;
  path: string[];
}) {
  const { navigate } = useSite();
  const visual = visualFor(file);
  const parentPath = path.slice(0, -1);
  const context = ["Home", ...parentPath].join(" / ");

  const chips = [
    visual.typeLabel.toUpperCase(),
    formatSize(file.size),
    `UPDATED ${formatDate(file.mtime).toUpperCase()}`,
  ];

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 p-[clamp(16px,3vw,32px)]">
      {/* Mobile: back button + context */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => navigate(parentPath.length ? `/${parentPath.map(encodeURIComponent).join("/")}` : "/")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink"
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

      <div className="flex flex-wrap items-center gap-[18px]">
        <span
          className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[20px] ${visual.tile}`}
        >
          <Icon name={visual.icon} size={40} filled />
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="text-[clamp(20px,2.6vw,26px)] font-bold leading-[1.25] tracking-[-0.01em] text-ink text-pretty">
            {displayName(file)}
          </h1>
          <Chips items={chips} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <a
          href={file.downloadUrl}
          className="flex max-w-[280px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-brand px-[22px] py-[13px] text-[14.5px] font-semibold text-brand-ink transition-opacity hover:opacity-90"
          style={{ minWidth: 180 }}
        >
          <Icon name="download" size={20} />
          Download
        </a>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-line-strong px-[22px] py-[13px] text-[14.5px] font-semibold text-ink transition-colors hover:border-brand"
        >
          <Icon name="open_in_new" size={19} />
          Open original
        </a>
      </div>

      <FileViewer file={file} path={path} />
    </div>
  );
}
