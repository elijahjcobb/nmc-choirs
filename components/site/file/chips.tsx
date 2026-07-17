// Small pill chips describing a file (type, size, pages, duration, updated).
export function Chips({ items }: { items: string[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-[7px]">
      {items.map((label) => (
        <span
          key={label}
          className="rounded-full border border-line px-[11px] py-1 text-[11.5px] font-semibold tracking-[0.04em] text-subtle"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
