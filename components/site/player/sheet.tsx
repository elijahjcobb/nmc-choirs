// Bottom-sheet chrome built on vaul, portaled INTO the site root so it inherits
// the Space Grotesk font and theme tokens (which the app wrapper provides).
import type { ReactNode } from "react";
import { Drawer } from "vaul";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  const container =
    typeof document !== "undefined"
      ? (document.querySelector<HTMLElement>(".site-root") ?? undefined)
      : undefined;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal container={container}>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-[24px] border-t border-line bg-canvas text-ink outline-none">
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line" />
          <div className="mx-auto w-full max-w-[560px] overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
