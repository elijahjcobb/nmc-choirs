// Small uppercase section heading (FOLDERS / FILES).
export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="text-[11.5px] font-semibold tracking-[0.12em] text-subtle">
      {children}
    </div>
  );
}
