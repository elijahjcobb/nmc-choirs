// Grid / list toggle for the folder section. The choice is persisted per device.
import { useViewMode } from "@/hooks/use-view-mode";
import { Icon } from "../icons";

type DocumentWithVT = Document & { startViewTransition?: (cb: () => void) => unknown };

export function ViewToggle() {
  const [mode, setMode] = useViewMode();
  const next = mode === "grid" ? "list" : "grid";

  const toggle = () => {
    const run = () => setMode(next);
    const doc = typeof document !== "undefined" ? (document as DocumentWithVT) : null;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc?.startViewTransition && !reduce) doc.startViewTransition(run);
    else run();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-[7px] text-[12.5px] font-medium text-subtle transition-colors hover:border-brand hover:text-brand"
    >
      <Icon name={mode === "grid" ? "grid_view" : "view_list"} size={16} />
      {mode === "grid" ? "Grid" : "List"}
    </button>
  );
}
