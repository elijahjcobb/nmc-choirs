// Mobile top bar (below 760px): brand + library search. Shown on browse screens;
// file pages render their own back bar instead.
import { useSite } from "../site-context";
import { Icon } from "../icons";

export function MobileHeader() {
  const { query, setQuery, navigate } = useSite();
  return (
    <div
      className="flex flex-col gap-3 px-5 pt-3.5 md:hidden"
      style={{ paddingTop: "calc(14px + env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-[11px] text-left"
      >
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pine-white.png" alt="" className="h-[23px] w-auto" />
        </span>
        <span className="text-[19px] font-bold text-ink">NMC Music</span>
      </button>
      <label className="flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-[15px] py-[11px]">
        <Icon name="search" size={19} className="shrink-0 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scores & recordings"
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-subtle/80"
        />
      </label>
    </div>
  );
}
