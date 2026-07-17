// Responsive frame: a sticky sidebar on desktop, a full-width column on mobile.
// The frame (and the persistent player mounted alongside it) never remounts as
// the user navigates, so playback survives route changes.
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {children}
        <div className="flex-1" />
        <footer className="px-4 pb-6 pt-5 text-center text-[11.5px] text-faint">
          NMC Music · Northwestern Michigan College
        </footer>
      </div>
    </div>
  );
}
