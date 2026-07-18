// Chip breadcrumbs: Home + each folder segment, with an optional trailing
// (non-link) label for the current file.
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { hrefForPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
  home?: boolean;
  active: boolean;
}

export function Breadcrumbs({ trailingLabel }: { trailingLabel?: string }) {
  const { path, navigate } = useSite();
  const hasTrailing = Boolean(trailingLabel);
  // When a trailing (file) label is shown, the last path segment IS that file,
  // so the folder trail is the parent path.
  const trail = hasTrailing ? path.slice(0, -1) : path;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/", home: true, active: trail.length === 0 && !hasTrailing },
    ...trail.map((seg, i) => ({
      label: seg,
      href: hrefForPath(trail.slice(0, i + 1)),
      active: !hasTrailing && i === trail.length - 1,
    })),
  ];
  if (trailingLabel) crumbs.push({ label: trailingLabel, active: true });

  return (
    <div className="nmc-noscrollbar flex items-center gap-2 overflow-x-auto">
      {crumbs.map((crumb, i) => (
        <div key={crumb.href ?? crumb.label} className="flex shrink-0 items-center gap-2">
          {i > 0 && (
            <Icon name="chevron_right" size={16} className="shrink-0 text-faint" />
          )}
          <button
            type="button"
            disabled={!crumb.href}
            onClick={() => crumb.href && navigate(crumb.href)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[13px] py-1.5 text-[12.5px] transition-colors",
              crumb.active
                ? "border border-line-strong bg-surface font-semibold text-ink"
                : "font-medium text-subtle hover:text-brand",
            )}
          >
            {crumb.home && <Icon name="home" size={15} filled />}
            {crumb.label}
          </button>
        </div>
      ))}
    </div>
  );
}
