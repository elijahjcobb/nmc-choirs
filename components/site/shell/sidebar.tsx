// Desktop sidebar: brand, library search, and top-level navigation. Hidden below
// the 760px breakpoint (the mobile header takes over).
import { useSite } from "../site-context";
import { Icon } from "../icons";
import { PineLogo } from "./pine-logo";
import type { IconName } from "../icons";
import { hrefForPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: IconName;
  href: string;
  active: boolean;
}

export function Sidebar() {
  const { tree, path, query, setQuery, navigate } = useSite();

  const searching = query.trim().length > 0;
  const topFolders = tree.root.children.filter((c) => c.type === "folder");

  const items: NavItem[] = [
    {
      label: "Home",
      icon: "home",
      href: "/",
      active: !searching && path.length === 0,
    },
    ...topFolders.map((folder) => ({
      label: folder.name,
      icon: "folder" as IconName,
      href: hrefForPath([folder.name]),
      active: !searching && path[0] === folder.name,
    })),
  ];

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div
        className="sticky top-0 flex h-[100dvh] flex-col gap-4 border-r border-line bg-sidebar px-[14px] pb-5"
        style={{ paddingTop: "calc(20px + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-[11px] px-1.5 text-left"
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-brand">
            <PineLogo height={23} />
          </span>
          <span className="text-[17px] font-bold text-ink">NMC Music</span>
        </button>

        <label className="flex items-center gap-[9px] rounded-xl border border-line bg-field px-[13px] py-[9px]">
          <Icon name="search" size={18} className="shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library"
            className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-subtle/80"
          />
        </label>

        <nav className="flex flex-col gap-[3px]">
          {items.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              className={cn(
                "flex items-center gap-[11px] rounded-[11px] px-3 py-[10px] text-left transition-colors",
                item.active ? "bg-nav-active" : "hover:bg-nav-hover",
              )}
            >
              <Icon
                name={item.icon}
                size={20}
                filled={item.active}
                className={cn("shrink-0", item.active ? "text-brand" : "text-subtle")}
              />
              <span
                className={cn(
                  "truncate text-sm",
                  item.active ? "font-semibold text-ink" : "text-ink/75",
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <p className="px-2 text-[11.5px] leading-normal text-faint">
          Northwestern Michigan College
          <br />
          Music Department
        </p>
      </div>
    </aside>
  );
}
