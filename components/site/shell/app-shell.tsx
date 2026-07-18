// Responsive frame: a sticky sidebar on desktop, a full-width column on mobile.
// The frame (and the persistent player mounted alongside it) never remounts as
// the user navigates, so playback survives route changes.
import { useCallback } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Icon } from "../icons";
import { useSite } from "../site-context";
import { usePlayerState } from "@/lib/player/use-player";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

export function AppShell({ children }: { children: ReactNode }) {
  const { track } = usePlayerState();
  const { tree } = useSite();
  const refresh = useCallback(() => tree.refresh(), [tree]);
  const pull = usePullToRefresh(refresh);

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: pull.distance, transition: pull.distance === 0 ? "height 0.2s ease" : undefined }}
        >
          <Icon
            name="refresh"
            size={22}
            className={`text-brand ${pull.refreshing ? "animate-spin" : ""}`}
            style={{ transform: pull.refreshing ? undefined : `rotate(${pull.distance * 3}deg)`, opacity: pull.distance > 4 ? 1 : 0 }}
          />
        </div>
        {children}
        <div className="flex-1" />
        <footer className="px-4 pb-6 pt-5 text-center text-[11.5px] text-faint">
          NMC Music · Northwestern Michigan College
        </footer>
        {/* Clearance for the fixed mini-player. */}
        {track && (
          <div
            aria-hidden
            style={{ height: "calc(68px + env(safe-area-inset-bottom))" }}
          />
        )}
      </div>
    </div>
  );
}
