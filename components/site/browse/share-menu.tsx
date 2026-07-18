// Share sheet for a file or folder: native share, copy link, and (for files)
// download / open original. Deep-link params (?t=, ?page=) can be passed in.
import { Sheet } from "../player/sheet";
import { Icon } from "../icons";
import type { IconName } from "../icons";
import type { TreeNode } from "@/lib/tree-types";
import { displayName } from "@/lib/paths";
import { copyLink, fileUrl, shareLink } from "@/lib/share";

function Item({
  icon,
  label,
  onClick,
  href,
  download,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  href?: string;
  download?: boolean;
}) {
  const cls =
    "flex w-full items-center gap-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-left text-[14.5px] font-medium text-ink transition-colors hover:border-brand";
  const inner = (
    <>
      <Icon name={icon} size={20} className="text-subtle" />
      {label}
    </>
  );
  if (href) {
    return (
      <a href={href} download={download} target={download ? undefined : "_blank"} rel="noreferrer" className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function ShareMenu({
  node,
  path,
  open,
  onOpenChange,
  params,
}: {
  node: TreeNode;
  path: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params?: Record<string, string | number>;
}) {
  const name = displayName(node);
  const url = fileUrl(path, params);
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Share ${name}`}>
      <div className="mb-4 text-center">
        <div className="truncate text-base font-semibold text-ink">{name}</div>
      </div>
      <div className="flex flex-col gap-2">
        <Item icon="share" label="Share…" onClick={() => { void shareLink(url, name); close(); }} />
        <Item icon="link" label="Copy link" onClick={() => { void copyLink(url); close(); }} />
        {node.type === "file" && (
          <Item icon="download" label="Download" href={node.downloadUrl} download onClick={close} />
        )}
      </div>
    </Sheet>
  );
}
